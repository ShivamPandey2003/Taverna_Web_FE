import { USE_MOCK_API, callApi, request, toQueryString } from "./apiClient";
import { toast } from "sonner";
import { mockServer } from "./mock/mockServer";
import { toOfferPage, type OfferPagination, type OfferResponse } from "./offerApi";
import { formatMiles } from "./vehicleApi";
import { BookingStatus } from "@/types/booking";
import type { ServiceId } from "@/types/service";
import { journeyAdvisorProgress, journeyTripProgress } from "@/types/admin";
import type {
  AdminBooking,
  AdminBookingRow,
  BookingHistory,
  BookingHistoryDetails,
  BookingHistoryEvent,
  BookingJourney,
  HistoryContact,
  BookingListParams,
  IntakeMethod,
  Paginated,
  StaffAvailability,
  StaffListParams,
  StaffMember,
  StaffRole,
  ValetLeg,
} from "@/types/admin";
import type { Offer, OfferInput, OfferListParams } from "@/types/offer";

export type StaffInput = Pick<StaffMember, "name" | "email" | "phone" | "available">;

// The real API's name for each kind of staff, in the staff/:staffType/… paths
const staffTypes: Record<StaffRole, string> = {
  valet: "valet-operator",
  manager: "advisor",
};

// ---- Offers ----

// The longest search offers/list takes
export const OFFER_SEARCH_MAX = 200;

// GET offers/list (rows mapped by toOffer, shared with the customer's offers)
interface OfferListResponse {
  records: OfferResponse[];
  pagination: OfferPagination;
}

// Bulk upload (presigned S3 URL)

const OFFER_CSV_TYPE = "text/csv";

// POST offers/bulk-upload/prepare
interface PrepareUploadResponse {
  fileKey: string;
  uploadUrl: string;
  method: string;
  headers: Record<string, string> | null;
  expiresInSeconds: number;
}

// POST offers/bulk-upload/complete
interface CompleteUploadResponse {
  dealershipId: string | null;
  vehiclesImported: number;
  offersImported: number;
  failedRows: number;
  // Not seen filled in yet
  errors: unknown[] | null;
  uploadedBy: string;
}

export type OfferUploadStep = "preparing" | "uploading" | "importing";

export interface OfferUploadResult {
  offersImported: number;
  vehiclesImported: number;
  failedRows: number;
  errors: unknown[];
}

// The file goes straight to S3 at the signed URL, with exactly the headers it
// was signed for: a plain fetch, not the API client (whose Bearer token S3
// would refuse). Not the API layer, so a failure is toasted here.
async function putToStorage(target: PrepareUploadResponse, file: File) {
  const failed = "Couldn't upload the file. Please try again.";
  let response: Response;
  try {
    response = await fetch(target.uploadUrl, {
      method: target.method || "PUT",
      headers: target.headers ?? { "Content-Type": OFFER_CSV_TYPE },
      body: file,
    });
  } catch (error) {
    toast.error(failed);
    throw new Error(failed, { cause: error });
  }
  if (!response.ok) {
    // An expired link (it lasts expiresInSeconds) reads as 403
    toast.error(response.status === 403 ? "The upload link expired. Please try again." : failed);
    throw new Error(`Storage upload failed (${response.status})`);
  }
}

// What staff/:staffType/list filters on (the server does the search and filter)
export type StaffFilters = Pick<StaffListParams, "search" | "availability">;

// The list's `search` can be at most this long
export const STAFF_SEARCH_MAX = 200;

// The `status` sent for each availability filter. A guess: the API hasn't said
// which values it takes. "all" sends no status.
const staffStatuses: Record<Exclude<StaffAvailability, "all">, string> = {
  available: "available",
  busy: "busy",
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

// The status booking/admin/update puts a booking at for each way in and back. A
// valet has none to send: they're put on the booking by assigning them.
// Self-drive is CUSTOMER_IN on the way in (Customer Drop In) and
// CUSTOMER_DROP_OFF on the way back (Customer Drop Off).
const CUSTOMER_IN = "CUSTOMER_IN";
const CUSTOMER_DROP_OFF = "CUSTOMER_DROP_OFF";
const legStatuses: Record<ValetLeg, Partial<Record<IntakeMethod, string>>> = {
  // Back to a valet from a tow truck / self-drive puts the booking back at BOOKED
  pickup: { valet: "BOOKED", towTruck: "TOW_ASSIGNED", selfDrive: CUSTOMER_IN },
  // Back to a valet from drop off puts the booking back where the service left it
  delivery: { valet: "PAYMENT_CONFIRMED", selfDrive: CUSTOMER_DROP_OFF },
};

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

// A booking's steps are kept once asked for. They do change when the admin
// changes how a trip is made (Customer Drop Off has no delivery valet steps), so
// that clears them (setLegMethod), and they're asked for again whenever the
// booking's current status isn't one of them.
const journeySteps = new Map<string, BookingJourney["steps"]>();
// The status the steps were last asked for again on, so a status that's never
// among them (e.g. PAYMENT_VERIFICATION_PENDING) doesn't ask on every poll
const stepsRefreshedFor = new Map<string, string>();

async function getJourneySteps(id: string, fresh = false) {
  const cached = journeySteps.get(id);
  if (cached && !fresh) return cached;

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
  const [cachedSteps, summary] = await Promise.all([
    getJourneySteps(id),
    request<StatusSummaryResponse>("get", `booking/admin/${id}/status-summary`),
  ]);
  const current = toStepKey(summary.currentStatus);
  // A status the kept steps don't have means they're out of date: without it
  // nothing counts as reached and the drawer would fall back to the first step
  const known = cachedSteps.some((step) => step.key === current);
  const refresh = !known && stepsRefreshedFor.get(id) !== current;
  if (refresh) stepsRefreshedFor.set(id, current);
  const steps = refresh ? await getJourneySteps(id, true) : cachedSteps;
  return {
    journey: {
      steps,
      current,
      statusLabel: summary.label,
      doneAt: summary.doneAt,
    },
    status: summary.currentStatus,
  };
}

// GET booking/admin/:bmsId/history: the events, and the booking's details,
// shown under the history's section titles
interface BookingHistoryResponse {
  bmsId: string;
  bookingType: string;
  currentStatus: string;
  bookedAt: string;
  appointmentAt: string | null;
  dealershipTimezone: string | null;
  serviceDescription: string | null;
  isClosed: boolean;
  user_name: string | null;
  user_email: string | null;
  user_phone: string | null;
  vin: string;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  currentMileage: number | null;
  invoiceId: string | null;
  invoiceTotal: number | null;
  invoiceCurrency: string | null;
  invoiceItems: { description: string; amount: string }[] | null;
  invoiceGeneratedAt: string | null;
  invoiceAdvisorName: string | null;
  paymentId: string | null;
  paymentStatus: string | null;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  paymentMethodType: string | null;
  providerPaymentId: string | null;
  paymentCreatedAt: string | null;
  paymentPaidAt: string | null;
  paymentFailureReason: string | null;
  pickupValetName: string | null;
  pickupValetEmail: string | null;
  pickupValetPhone: string | null;
  advisorName: string | null;
  advisorEmail: string | null;
  advisorPhone: string | null;
  deliveryValetName: string | null;
  deliveryValetEmail: string | null;
  deliveryValetPhone: string | null;
  history: BookingHistoryEvent[] | null;
}

const historyContact = (
  name: string | null,
  email: string | null,
  phone: string | null,
): HistoryContact | null => (name ? { name, email: email || null, phone: phone || null } : null);

function toHistoryDetails(response: BookingHistoryResponse): BookingHistoryDetails {
  const currency = response.invoiceCurrency || "USD";
  return {
    customer: historyContact(response.user_name, response.user_email, response.user_phone),
    vehicle: {
      name: [response.vehicleYear, response.vehicleMake, response.vehicleModel]
        .filter(Boolean)
        .join(" "),
      vin: response.vin,
      color: response.vehicleColor || null,
      miles: formatMiles(response.currentMileage),
    },
    bookingType: response.bookingType,
    serviceDescription: response.serviceDescription?.trim() || null,
    pickupValet: historyContact(
      response.pickupValetName,
      response.pickupValetEmail,
      response.pickupValetPhone,
    ),
    advisor: historyContact(response.advisorName, response.advisorEmail, response.advisorPhone),
    deliveryValet: historyContact(
      response.deliveryValetName,
      response.deliveryValetEmail,
      response.deliveryValetPhone,
    ),
    invoice: response.invoiceId
      ? {
          total: response.invoiceTotal ?? 0,
          currency,
          items: (response.invoiceItems ?? []).map((item) => ({
            description: item.description,
            amount: Number(item.amount) || 0,
          })),
          generatedAt: response.invoiceGeneratedAt,
          advisorName: response.invoiceAdvisorName,
        }
      : null,
    payment: response.paymentId
      ? {
          status: response.paymentStatus ?? "",
          amount: response.paymentAmount ?? 0,
          currency: response.paymentCurrency || currency,
          method: response.paymentMethodType,
          providerPaymentId: response.providerPaymentId,
          createdAt: response.paymentCreatedAt,
          paidAt: response.paymentPaidAt,
          failureReason: response.paymentFailureReason,
        }
      : null,
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

// Sorting, filtering, search and pagination all happen on the server
export const adminApi = {
  // Real API. It has no sorting: bookings come newest first.
  listBookings: async (params: BookingListParams): Promise<Paginated<AdminBookingRow>> => {
    const query = toQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search.trim(),
      status: params.status === "all" ? "" : params.status,
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
        statusCode: booking.bookingStatus,
        statusLabel: booking.statusLabel,
      })),
      total: pagination.totalItems,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: pagination.totalPages,
    };
  },

  // Real API: the booking's details and where it is on its journey, which the
  // two trips' and the service's progress are read from. Picking how the vehicle
  // travels is still the mock's, so while the mock is on it keeps a copy of the booking and the answer
  // carries that copy's progress for them.
  getBooking: async (id: string): Promise<AdminBooking> => {
    const [details, { journey, status }] = await Promise.all([
      request<BookingDetailsResponse>("get", `booking/admin/${id}/details`),
      getJourney(id),
    ]);
    const booking: AdminBooking = { ...toAdminBooking(details), journey };
    booking.pickupProgress = journeyTripProgress(journey, "pickup");
    booking.deliveryProgress = journeyTripProgress(journey, "delivery");
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

  // Real API: every change of status the booking has been through, oldest first
  getHistory: async (id: string): Promise<BookingHistory> => {
    const response = await request<BookingHistoryResponse>("get", `booking/admin/${id}/history`);
    return {
      id: response.bmsId,
      currentStatus: response.currentStatus,
      bookedAt: response.bookedAt,
      appointmentAt: response.appointmentAt,
      timezone: response.dealershipTimezone || null,
      isClosed: response.isClosed,
      events: [...(response.history ?? [])].sort(
        (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt),
      ),
      details: toHistoryDetails(response),
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
  // (delivery). Real API for a tow truck or self-drive (either way):
  // booking/admin/update puts the booking at that method's status (legStatuses),
  // and the hook loads its details again (the mock's copy is told too, since it
  // still remembers the choice). Switching the intake back to a valet posts
  // BOOKED, undoing the tow truck's / self-drive's status; the drawer then shows
  // the valet step, and assigning the valet there is the next call. The other
  // choices are the mock's as well, on a proposed path.
  setLegMethod: async (id: string, leg: ValetLeg, method: IntakeMethod): Promise<void> => {
    // The booking's steps change with how the trip is made
    journeySteps.delete(id);
    stepsRefreshedFor.delete(id);
    const bookingStatus = legStatuses[leg][method];
    if (!bookingStatus) {
      await callApi(
        () => mockServer.setLegMethod(id, leg, method),
        () => request<AdminBooking>("put", `/admin/bookings/${id}/${legPaths[leg]}`, { method }),
      );
      return;
    }

    await request("post", "booking/admin/update", { bmsId: id, data: { bookingStatus } });
    if (USE_MOCK_API) {
      try {
        mockServer.setLegMethod(id, leg, method);
      } catch {
        // The API has accepted the change; the copy catches up when it's loaded again
      }
    }
  },

  // Without a valet (self-drive, or a tow truck bringing the vehicle back): the
  // vehicle is at the dealership / back with the customer. Real API: the same
  // admin confirmation as the others (booking/admin/:bmsId/confirm). The mock's
  // copy stamps the trip's end too, since a self-drive trip's progress is still
  // read from it; then the booking is loaded again.
  confirmLegDone: async (id: string, leg: ValetLeg) => {
    await request("post", `booking/admin/${id}/confirm`);
    if (USE_MOCK_API) {
      try {
        mockServer.confirmLegDone(id, leg);
      } catch {
        // The API has accepted it; the copy catches up when it's loaded again
      }
    }
    return adminApi.getBooking(id);
  },

  // Pickup or delivery valet; assigning someone new restarts that trip. Real API:
  // its answer is a status summary, so the hook loads the booking's details again.
  assignValet: (id: string, leg: ValetLeg, valetId: string) =>
    assignStaff(id, leg === "pickup" ? "valetOperatorId" : "deliveryValetOperatorId", valetId),

  // The advisor, assigned with the real API like the valets
  assignRelationshipManager: (id: string, managerId: string) =>
    assignStaff(id, "advisorId", managerId),

  // Real API: "Mark Service Complete" is the same admin confirmation as the
  // others (booking/admin/:bmsId/confirm), applied at the end of the handover.
  // The mock's copy is completed too, for the summary's time; the drawer's status
  // is the API's, so the booking only shows as complete once the API says so.
  completeBooking: async (id: string) => {
    await request("post", `booking/admin/${id}/confirm`);
    if (USE_MOCK_API) {
      try {
        mockServer.completeBooking(id);
      } catch {
        // The API has accepted it; the copy catches up when it's loaded again
      }
    }
    return adminApi.getBooking(id);
  },

  // Real API: the uploaded offers, a page at a time (at most 100). Search
  // (VIN, stock number, vehicle, lender; at most 200 characters) and the
  // condition / offer type filters are the server's; "all" and an empty search
  // are left out. There is no sorting.
  listOffers: async (params: OfferListParams): Promise<Paginated<Offer>> => {
    const query = toQueryString({
      page: params.page,
      pageSize: Math.min(params.pageSize, 100),
      search: params.search.trim().slice(0, OFFER_SEARCH_MAX),
      condition: params.condition,
      offerType: params.offerType,
    });
    const { records, pagination } = await request<OfferListResponse>(
      "get",
      `offers/list${query}`,
    );

    return toOfferPage(records, pagination);
  },

  // Real API: saves every field of one offer, in the API's names. It answers
  // with the id alone, so the list is loaded again.
  updateOffer: (id: string, input: OfferInput) =>
    request<{ vehicleOfferId: string }>("put", `offers/update/${id}`, {
      vin: input.vin,
      stockNumber: input.stockNumber,
      condition: input.condition,
      year: input.year,
      brandName: input.brand,
      model: input.model,
      trim: input.trim,
      offerType: input.offerType,
      lender: input.lender,
      payment: input.payment,
      paymentNoTax: input.paymentNoTax,
      termMonths: input.term,
      apr: input.apr,
      downPayment: input.downPayment,
      dueAtSigning: input.dueAtSigning,
      totalRebate: input.totalRebate,
      description: input.description,
      disclaimer: input.disclaimer,
    }),

  // Real API
  deleteOffer: (id: string) =>
    request<{ vehicleOfferId: string }>("delete", `offers/delete/${id}`),

  // Real API, through a presigned S3 URL: offers/bulk-upload/prepare names the
  // file and answers with where to PUT it, the file goes straight to S3, then
  // offers/bulk-upload/complete imports it (replacing the offers there were).
  // `onStep` reports each step for the button.
  uploadOffers: async (
    file: File,
    onStep?: (step: OfferUploadStep) => void,
  ): Promise<OfferUploadResult> => {
    onStep?.("preparing");
    const target = await request<PrepareUploadResponse>("post", "offers/bulk-upload/prepare", {
      fileName: file.name,
      // Always text/csv: browsers report a CSV as all sorts of types, and the
      // URL is signed for the type named here
      contentType: OFFER_CSV_TYPE,
      fileSize: file.size,
    });

    onStep?.("uploading");
    await putToStorage(target, file);

    onStep?.("importing");
    const result = await request<CompleteUploadResponse>("post", "offers/bulk-upload/complete", {
      fileKey: target.fileKey,
    });

    return {
      offersImported: result.offersImported,
      vehiclesImported: result.vehiclesImported,
      failedRows: result.failedRows,
      errors: result.errors ?? [],
    };
  },

  // Real API: everyone of a role matching `search` (name, email or phone; at most
  // 200 characters) and the availability `status`, all at once (no sorting or
  // paging). Empty filters are left out. While the mock is on it keeps a copy,
  // for the calls it still answers.
  listStaff: async (
    role: StaffRole,
    { search = "", availability = "all" }: Partial<StaffFilters> = {},
  ): Promise<StaffMember[]> => {
    const { records } = await request<{ records: StaffResponse[] }>(
      "get",
      `staff/${staffTypes[role]}/list${toQueryString({
        search: search.trim().slice(0, STAFF_SEARCH_MAX),
        status: availability === "all" ? "" : staffStatuses[availability],
      })}`,
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
