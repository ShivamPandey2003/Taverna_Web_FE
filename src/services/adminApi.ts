import { USE_MOCK_API, callApi, request, toQueryString } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import { BookingStatus } from "@/types/booking";
import type { ServiceId } from "@/types/service";
import { journeyAdvisorProgress, journeyPickupProgress } from "@/types/admin";
import type {
  AdminBooking,
  AdminBookingRow,
  BookingJourney,
  BookingListParams,
  IntakeMethod,
  Paginated,
  StaffMember,
  StaffRole,
  ValetLeg,
  ValetMilestone,
} from "@/types/admin";
import type { Offer, OfferInput, OfferList, OfferListParams } from "@/types/offer";
import type { OfferCsvRow } from "@/components/features/offers/offerCsv";

export type StaffInput = Pick<StaffMember, "name" | "email" | "phone" | "available">;

// The real API's name for each kind of staff, in the staff/:staffType/… paths
const staffTypes: Record<StaffRole, string> = {
  valet: "valet-operator",
  manager: "advisor",
};

// A staff member, from staff/:staffType/list and staff/:staffType/save
// (update and delete only answer with the id)
interface StaffResponse {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  availableForNewBookings: boolean;
  // Only in the list
  activeBookings?: number;
}

const toStaffMember = (member: StaffResponse): StaffMember => ({
  id: member.id,
  name: member.fullName,
  email: member.email ?? "",
  phone: member.phone ?? "",
  available: member.availableForNewBookings,
  activeBookings: member.activeBookings ?? 0,
});

const legPaths: Record<ValetLeg, string> = { pickup: "intake", delivery: "handover" };

// GET booking/admin/list
interface BookingListResponse {
  bookings: {
    bmsId: string;
    customerName: string;
    customerPhone: string;
    vehicle: string;
    service: string;
    scheduled: string;
    bookingStatus: string;
    statusLabel: string;
  }[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

const bookingTypes: Record<ServiceId, string> = {
  "pickup-delivery": "PICKUP_AND_DELIVERY",
  "loaner-only": "LOANER_ONLY",
};

// The API names a status in capitals ("IN_QUEUE"), the app as it reads ("In-queue").
// Only IN_QUEUE has been seen so far, so the two are matched on their letters alone:
// tighten this once the API's full list of statuses is known.
const statusLetters = (status: string) => status.replace(/[^a-z]/gi, "").toLowerCase();

const toBookingStatus = (code: string) =>
  Object.values(BookingStatus).find((status) => statusLetters(status) === statusLetters(code)) ??
  null;

// GET booking/admin/:bmsId/details. The staff links (`pickupValetLink`, …) are
// not read yet: they have only been seen empty.
interface BookingDetailsResponse {
  bmsId: string;
  bookingStatus: string;
  bookingType: string;
  isDriveable: boolean;
  towRequested: boolean;
  pickupValetName: string | null;
  pickupValetPhone: string | null;
  pickupValetEmail: string | null;
  advisorName: string | null;
  advisorPhone: string | null;
  advisorEmail: string | null;
  deliveryValetName: string | null;
  deliveryValetPhone: string | null;
  deliveryValetEmail: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  // "2026 RAM 1500"
  vehicle: string;
  vin: string;
  pickupAddress: string | null;
  dealershipName: string;
  appointmentAt: string | null;
  bookingDate: string;
  confirmedAt: string | null;
  serviceDescription: string | null;
  // The advisor's bill, once sent. Only seen empty: the items are taken to be
  // what the advisor sent, `{ description, amount }`.
  invoiceTotal?: string | number | null;
  invoiceItems?: { description?: string; amount?: string | number }[] | null;
  invoiceGeneratedAt?: string | null;
}

// The API's bill has no tax: the total is the sum of its items
function toInvoice(details: BookingDetailsResponse): AdminBooking["invoice"] {
  if (details.invoiceTotal == null) return null;
  const total = Number(details.invoiceTotal) || 0;
  return {
    issuedAt: details.invoiceGeneratedAt ?? "",
    items: (details.invoiceItems ?? []).map((item) => ({
      label: item.description ?? "",
      amount: Number(item.amount) || 0,
    })),
    subtotal: total,
    taxRate: 0,
    tax: 0,
    total,
  };
}

// The API sends no staff ids here, so the email stands in for one
function toStaff(name: string | null, phone: string | null, email: string | null): StaffMember | null {
  if (!name) return null;
  return { id: email ?? name, name, email: email ?? "", phone: phone ?? "", available: true };
}

// "2026 RAM 1500" -> year, brand and model
function toBookingVehicle(vehicle: string, vin: string): AdminBooking["vehicle"] {
  const [first = "", ...rest] = vehicle.trim().split(/\s+/);
  const year = Number(first);
  const [brand = "", ...model] = Number.isNaN(year) ? [first, ...rest] : rest;
  return { brand, model: model.join(" "), year: Number.isNaN(year) ? 0 : year, vin };
}

function toAdminBooking(details: BookingDetailsResponse): AdminBooking {
  return {
    id: details.bmsId,
    customer: {
      id: details.customerEmail,
      name: details.customerName,
      email: details.customerEmail,
      phone: details.customerPhone,
    },
    serviceId: details.bookingType === "LOANER_ONLY" ? "loaner-only" : "pickup-delivery",
    vehicle: toBookingVehicle(details.vehicle, details.vin),
    pickup: details.pickupAddress ?? "",
    dealershipName: details.dealershipName,
    driveable: details.isDriveable,
    towTruck: details.towRequested,
    concern: details.serviceDescription ?? "",
    scheduledAt: details.appointmentAt,
    createdAt: details.bookingDate,
    status: toBookingStatus(details.bookingStatus) ?? BookingStatus.IN_QUEUE,
    confirmedAt: details.confirmedAt,
    valet: toStaff(details.pickupValetName, details.pickupValetPhone, details.pickupValetEmail),
    relationshipManager: toStaff(details.advisorName, details.advisorPhone, details.advisorEmail),
    deliveryValet: toStaff(
      details.deliveryValetName,
      details.deliveryValetPhone,
      details.deliveryValetEmail,
    ),
    payment: null,
    invoice: toInvoice(details),
  };
}

// GET booking/admin/:bmsId/journey-labels: `<step>Label` for every step of the
// booking's journey, in order; null for a step this booking doesn't have
type JourneyLabelsResponse = Record<string, string | null>;

// GET booking/admin/:bmsId/status-summary
interface StatusSummaryResponse {
  bmsId: string;
  currentStatus: string;
  label: string;
  doneAt: string | null;
  previousStatus: string | null;
}

// A booking's step names don't change, so they're asked for once
const journeySteps = new Map<string, BookingJourney["steps"]>();

async function getJourneySteps(id: string) {
  const cached = journeySteps.get(id);
  if (cached) return cached;

  const labels = await request<JourneyLabelsResponse>("get", `booking/admin/${id}/journey-labels`);
  const steps = Object.entries(labels).flatMap(([field, label]) =>
    field.endsWith("Label") && label ? [{ key: field.slice(0, -5), label }] : [],
  );
  journeySteps.set(id, steps);
  return steps;
}

// "VALET_DISPATCHED" -> "valetDispatched", the name its label goes by
const toStepKey = (status: string) =>
  status.toLowerCase().replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());

async function getJourney(id: string): Promise<{ journey: BookingJourney; status: string }> {
  const [steps, summary] = await Promise.all([
    getJourneySteps(id),
    request<StatusSummaryResponse>("get", `booking/admin/${id}/status-summary`),
  ]);
  return {
    journey: {
      steps,
      current: toStepKey(summary.currentStatus),
      statusLabel: summary.label,
      doneAt: summary.doneAt,
    },
    status: summary.currentStatus,
  };
}

// Who booking/staff/assign can put on a booking. One call assigns one person:
// the API wants every field in the body, so the others go as empty text.
type StaffAssignment = "advisorId" | "valetOperatorId" | "deliveryValetOperatorId";

const assignStaff = (bmsId: string, field: StaffAssignment, staffId: string) =>
  request<unknown>("post", "booking/staff/assign", {
    reason: "string",
    bmsId,
    advisorId: "",
    valetOperatorId: "",
    deliveryValetOperatorId: "",
    towOperatorId: "",
    scheduledAt: "",
    [field]: staffId,
  });

const toStatusCode =(status: BookingStatus) =>
  Object.entries(BookingStatus).find(([, value]) => value === status)![0];

// Sorting, filtering, search and pagination all happen on the server
export const adminApi = {
  // Real API. It has no sorting: bookings come newest first.
  listBookings: async (params: BookingListParams): Promise<Paginated<AdminBookingRow>> => {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search.trim(),
      status: params.status === "all" ? "" : toStatusCode(params.status),
      bookingType: params.serviceId === "all" ? "" : bookingTypes[params.serviceId],
    });
    const { bookings, pagination } = await request<BookingListResponse>(
      "get",
      `booking/admin/list${query}`,
    );

    return {
      items: bookings.map((booking) => ({
        id: booking.bmsId,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        vehicle: booking.vehicle,
        service: booking.service,
        scheduled: booking.scheduled,
        status: toBookingStatus(booking.bookingStatus),
        statusLabel: booking.statusLabel,
      })),
      total: pagination.totalItems,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: pagination.totalPages,
    };
  },

  // Real API: the booking's details and where it is on its journey, which the
  // pickup trip's and the service's progress are read from. The handover and
  // completing are still the mock's, so while the mock is on it keeps a copy of the booking and the answer
  // carries that copy's progress for them.
  getBooking: async (id: string): Promise<AdminBooking> => {
    const [details, { journey, status }] = await Promise.all([
      request<BookingDetailsResponse>("get", `booking/admin/${id}/details`),
      getJourney(id),
    ]);
    const booking: AdminBooking = { ...toAdminBooking(details), journey };
    booking.pickupProgress = journeyPickupProgress(journey);
    booking.advisorProgress = journeyAdvisorProgress(journey);
    if (!USE_MOCK_API) return booking;

    const copy = structuredClone(mockServer.syncBooking(booking));
    // The copy's status only moves with the mock's own steps
    return {
      ...copy,
      journey,
      status: toBookingStatus(status) ?? copy.status,
      invoice: booking.invoice,
    };
  },

  // Real API: the admin confirmation the booking's stage allows (the new
  // booking, the vehicle received at the dealership, the payment, the vehicle
  // ready to dispatch). Its answer is only a
  // summary of the new status, so the booking is loaded again for the drawer.
  confirmBooking: async (id: string) => {
    await request("post", `booking/admin/${id}/confirm`);
    return adminApi.getBooking(id);
  },

  // How the vehicle gets to the dealership (pickup) or back to the customer
  // (delivery). Changing it drops that trip's valet and their progress. The
  // paths are a proposal: agree them with the backend.
  setLegMethod: (id: string, leg: ValetLeg, method: IntakeMethod) =>
    callApi(
      () => mockServer.setLegMethod(id, leg, method),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/${legPaths[leg]}`, { method }),
    ),

  // Without a valet: the vehicle is at the dealership / back with the customer
  confirmLegDone: (id: string, leg: ValetLeg) =>
    callApi(
      () => mockServer.confirmLegDone(id, leg),
      () =>
        request<AdminBooking>(
          "put",
          `/admin/bookings/${id}/${legPaths[leg]}/${leg === "pickup" ? "arrived" : "delivered"}`,
        ),
    ),

  // Pickup or delivery valet; assigning someone new restarts that trip. Real API:
  // its answer is a status summary, so the hook loads the booking's details again.
  assignValet: (id: string, leg: ValetLeg, valetId: string) =>
    assignStaff(id, leg === "pickup" ? "valetOperatorId" : "deliveryValetOperatorId", valetId),

  // Marks the next milestone of a valet trip (milestones go in order)
  updateValetProgress: (id: string, leg: ValetLeg, milestone: ValetMilestone) =>
    callApi(
      () => mockServer.updateValetProgress(id, leg, milestone),
      () =>
        request<AdminBooking>("put", `/admin/bookings/${id}/valet/progress`, {
          leg,
          milestone,
        }),
    ),

  // The advisor, assigned with the real API like the valets
  assignRelationshipManager: (id: string, managerId: string) =>
    assignStaff(id, "advisorId", managerId),

  completeBooking: (id: string) =>
    callApi(
      () => mockServer.completeBooking(id),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/complete`),
    ),

  // The uploaded offers, a page at a time; search, filters and sorting happen on
  // the server. The path is a proposal: agree it with the backend.
  listOffers: (params: OfferListParams) =>
    callApi(
      () => mockServer.listOffers(params),
      () => request<OfferList>("get", `/admin/offers${toQueryString({ ...params })}`),
    ),

  updateOffer: (id: string, input: OfferInput) =>
    callApi(
      () => mockServer.updateOffer(id, input),
      () => request<Offer>("put", `/admin/offers/${id}`, input),
    ),

  deleteOffer: (id: string) =>
    callApi(
      () => mockServer.deleteOffer(id),
      () => request<{ id: string }>("delete", `/admin/offers/${id}`),
    ),

  // Sends the offers CSV as multipart form data; the server parses and stores it,
  // replacing the offers it had. The path is a proposal: agree it with the backend.
  // `rows` (the file as parsed in the browser) only feeds the mock.
  uploadOffers: (file: File, rows: OfferCsvRow[]) =>
    callApi(
      () => mockServer.uploadOffers(rows),
      () => {
        const form = new FormData();
        form.append("file", file);
        return request<{ imported: number }>("post", "/admin/offers/upload", form);
      },
    ),

  // Real API: everyone of a role at once (it has no search, sorting or paging).
  // While the mock is on it keeps a copy, for the calls it still answers.
  listStaff: async (role: StaffRole): Promise<StaffMember[]> => {
    const { records } = await request<{ records: StaffResponse[] }>(
      "get",
      `staff/${staffTypes[role]}/list`,
    );
    const staff = records.filter((member) => member.isActive !== false).map(toStaffMember);

    if (USE_MOCK_API) mockServer.syncStaff(role, staff);
    return staff;
  },

  // Real API. The mock gets its copy straight away, so someone added from the
  // workflow's assign step can be assigned without waiting for the list.
  createStaff: async (role: StaffRole, input: StaffInput) => {
    const member = toStaffMember(
      await request<StaffResponse>("post", `staff/${staffTypes[role]}/save`, {
        fullName: input.name,
        email: input.email,
        phone: input.phone,
        availableForNewBookings: input.available,
      }),
    );

    if (USE_MOCK_API) mockServer.syncStaff(role, [member]);
    return member;
  },

  // Real API. It answers with the id alone, so the member is what was sent.
  updateStaff: async (role: StaffRole, id: string, input: StaffInput): Promise<StaffMember> => {
    await request("post", `staff/${staffTypes[role]}/update/${id}`, {
      fullName: input.name,
      email: input.email,
      phone: input.phone,
      isActive: true,
      availableForNewBookings: input.available,
    });
    const member = { id, ...input };

    if (USE_MOCK_API) mockServer.syncStaff(role, [member]);
    return member;
  },

  // Real API. The mock drops its copy too.
  deleteStaff: async (role: StaffRole, id: string) => {
    await request("post", `staff/${staffTypes[role]}/delete/${id}`);
    if (USE_MOCK_API) mockServer.removeStaff(role, id);
    return { id };
  },
};
