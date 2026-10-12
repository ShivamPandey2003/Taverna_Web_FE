import { USE_MOCK_API, callApi, request, toQueryString } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import { BookingStatus } from "@/types/booking";
import type { ServiceId } from "@/types/service";
import type {
  AdminBooking,
  AdminBookingRow,
  AdvisorMilestone,
  BookingListParams,
  IntakeMethod,
  Paginated,
  StaffListParams,
  StaffMember,
  StaffRole,
  ValetLeg,
  ValetMilestone,
} from "@/types/admin";
import type { Dealership } from "@/types/dealership";
import type { Offer, OfferInput, OfferList, OfferListParams } from "@/types/offer";
import type { OfferCsvRow } from "@/components/features/offers/offerCsv";

export type StaffInput = Pick<StaffMember, "name" | "email" | "phone" | "available">;

// Valets and advisors share one API shape under different paths
// (advisors are still "relationship managers" in the API)
const staffPaths: Record<StaffRole, string> = {
  valet: "/admin/valets",
  manager: "/admin/relationship-managers",
};
export type DealershipInput = Omit<Dealership, "id">;

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

// GET booking/admin/:bmsId/details. The invoice fields (`invoiceTotal`,
// `invoiceItems`, …) and the staff links (`pickupValetLink`, …) are not read yet:
// they have only been seen empty.
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
    towTruck: details.isDriveable ? undefined : details.towRequested,
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
  };
}

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

  // Real API. The workflow steps below are still the mock's, so while the mock is
  // on it keeps a copy of the booking and the answer carries that copy's progress.
  getBooking: async (id: string): Promise<AdminBooking> => {
    const booking = toAdminBooking(
      await request<BookingDetailsResponse>("get", `booking/admin/${id}/details`),
    );
    return USE_MOCK_API ? structuredClone(mockServer.syncBooking(booking)) : booking;
  },

  confirmBooking: (id: string) =>
    callApi(
      () => mockServer.confirmBooking(id),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/confirm`),
    ),

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

  // Pickup or delivery valet; assigning someone new restarts that trip
  assignValet: (id: string, leg: ValetLeg, valetId: string) =>
    callApi(
      () => mockServer.assignValet(id, leg, valetId),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/valet`, { leg, valetId }),
    ),

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

  assignRelationshipManager: (id: string, managerId: string) =>
    callApi(
      () => mockServer.assignRelationshipManager(id, managerId),
      () =>
        request<AdminBooking>("put", `/admin/bookings/${id}/relationship-manager`, {
          managerId,
        }),
    ),

  // Service updates the advisor shares with the customer (in order)
  updateAdvisorProgress: (id: string, milestone: AdvisorMilestone) =>
    callApi(
      () => mockServer.updateAdvisorProgress(id, milestone),
      () =>
        request<AdminBooking>("put", `/admin/bookings/${id}/relationship-manager/progress`, {
          milestone,
        }),
    ),

  // Sends the customer the bill; the server works out the amount
  generateInvoice: (id: string) =>
    callApi(
      () => mockServer.generateInvoice(id),
      () => request<AdminBooking>("post", `/admin/bookings/${id}/invoice`),
    ),

  // Marks the bill as paid by the customer
  confirmPayment: (id: string) =>
    callApi(
      () => mockServer.confirmPayment(id),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/payment/confirm`),
    ),

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

  listStaff: (role: StaffRole, params: StaffListParams) =>
    callApi(
      () => mockServer.listStaff(role, params),
      () =>
        request<Paginated<StaffMember>>(
          "get",
          `${staffPaths[role]}${toQueryString({ ...params })}`,
        ),
    ),

  createStaff: (role: StaffRole, input: StaffInput) =>
    callApi(
      () => mockServer.createStaff(role, input),
      () => request<StaffMember>("post", staffPaths[role], input),
    ),

  updateStaff: (role: StaffRole, id: string, input: StaffInput) =>
    callApi(
      () => mockServer.updateStaff(role, id, input),
      () => request<StaffMember>("put", `${staffPaths[role]}/${id}`, input),
    ),

  deleteStaff: (role: StaffRole, id: string) =>
    callApi(
      () => mockServer.deleteStaff(role, id),
      () => request<{ id: string }>("delete", `${staffPaths[role]}/${id}`),
    ),

  listDealerships: (search: string) =>
    callApi(
      () => mockServer.listDealerships(search),
      () => request<Dealership[]>("get", `/admin/dealerships${toQueryString({ search })}`),
    ),

  createDealership: (input: DealershipInput) =>
    callApi(
      () => mockServer.createDealership(input),
      () => request<Dealership>("post", "/admin/dealerships", input),
    ),

  updateDealership: (id: string, input: DealershipInput) =>
    callApi(
      () => mockServer.updateDealership(id, input),
      () => request<Dealership>("put", `/admin/dealerships/${id}`, input),
    ),

  deleteDealership: (id: string) =>
    callApi(
      () => mockServer.deleteDealership(id),
      () => request<{ id: string }>("delete", `/admin/dealerships/${id}`),
    ),
};
