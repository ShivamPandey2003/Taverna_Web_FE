import { USE_MOCK_API, callApi, request } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import { formatMiles } from "./vehicleApi";
import type { AdminBooking } from "@/types/admin";
import {
  BookingStatus,
  type BookingSummary,
  type CustomerBookingDetails,
  type ServiceStatus,
} from "@/types/booking";
import type { ServiceId } from "@/types/service";

// What the mock keeps of a booking, plus the ids the real API books with
export type CreateBookingInput = Parameters<typeof mockServer.createBooking>[0] & {
  vehicleId: string;
  dealershipId: string;
  addressId: string;
};

// POST booking/save
interface SaveBookingResponse {
  bmsId: string;
  status: string;
  bookingStatus: string;
  isActive: number;
  isDriveable: boolean;
  towRequested: boolean;
  bookingType: string;
  appointmentAt: string;
  userMessage: string;
}

const bookingTypes: Record<ServiceId, string> = {
  "pickup-delivery": "PICKUP_AND_DELIVERY",
  "loaner-only": "LOANER_ONLY",
};

const pad = (value: number) => String(value).padStart(2, "0");

// The API reads the date and time as clock time at the dealership, so the time the
// customer picked is sent as shown on their device, not converted to UTC. Without
// a scheduled time both are null, which books for now.
function toAppointment(scheduledAt: string | null) {
  if (!scheduledAt) return { appointmentDate: null, appointmentTime: null };
  const date = new Date(scheduledAt);
  return {
    appointmentDate: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    appointmentTime: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

// GET booking/customer/:bmsId/status-summary
interface StatusSummaryResponse {
  bmsId: string;
  currentStatus: string;
  label: string;
  doneAt: string | null;
  previousStatus: string | null;
}

// GET booking/customer/:bmsId/details
interface CustomerDetailsResponse {
  bmsId: string;
  dealershipName: string;
  vehicle: string;
  service: string;
  scheduled: string;
  bookingStatus: string;
  statusLabel: string;
  invoiceTotal: number | string | null;
  invoiceCurrency: string | null;
  // Only seen empty; taken to be the same rows the advisor sends
  invoiceItems: { description: string; amount: number | string }[];
  invoiceGeneratedAt: string | null;
  bookingDate: string;
  isDriveable: boolean;
  towRequested: boolean;
  pickupAddress: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vin: string;
  maskedVin: string;
  mileage: number | null;
  customerName: string;
  customerPhone: string;
}

// The stage each of the API's statuses belongs to: the app has one colour and
// icon per stage (statusColors), the API many statuses within each
const statusStages: Record<string, BookingStatus> = {
  IN_QUEUE: BookingStatus.IN_QUEUE,
  BOOKED: BookingStatus.BOOKED,
  VALET_ASSIGNED: BookingStatus.VALET_ASSIGNED,
  TOW_ASSIGNED: BookingStatus.VALET_ASSIGNED,
  VALET_DISPATCHED: BookingStatus.VALET_ON_ROAD,
  VALET_ARRIVED_AT_CUSTOMER: BookingStatus.VALET_ON_ROAD,
  VEHICLE_HANDED_OVER_TO_VALET: BookingStatus.VALET_ON_ROAD,
  VALET_PICKUP_CONFIRMED: BookingStatus.VEHICLE_PICKED_UP,
  VEHICLE_PICKED_UP: BookingStatus.VEHICLE_PICKED_UP,
  VEHICLE_ARRIVED_AT_DEALERSHIP: BookingStatus.VEHICLE_ARRIVED,
  VEHICLE_AT_DEALERSHIP_CONFIRMED: BookingStatus.VEHICLE_ARRIVED,
  ADVISOR_ASSIGNED: BookingStatus.VEHICLE_ARRIVED,
  VEHICLE_IN_INSPECTION: BookingStatus.IN_SERVICE,
  INSPECTION_COMPLETED: BookingStatus.IN_SERVICE,
  INSPECTION_APPROVED: BookingStatus.IN_SERVICE,
  VEHICLE_IN_SERVICE: BookingStatus.IN_SERVICE,
  SERVICE_COMPLETED: BookingStatus.IN_SERVICE,
  INVOICE_GENERATED: BookingStatus.BILL_GENERATED,
  PAYMENT_CONFIRMED: BookingStatus.VEHICLE_RETURN,
  READY_FOR_DISPATCH: BookingStatus.VEHICLE_RETURN,
  DELIVERY_VALET_ASSIGNED: BookingStatus.VEHICLE_RETURN,
  DELIVERY_VALET_DISPATCHED: BookingStatus.VALET_ON_ROAD,
  DELIVERY_VEHICLE_PICKED_UP: BookingStatus.VALET_ON_ROAD,
  DELIVERY_VALET_ARRIVED_AT_CUSTOMER: BookingStatus.VEHICLE_RETURN,
  VEHICLE_DELIVERED: BookingStatus.VEHICLE_RETURN,
  SELF_COLLECTION_HANDED_OVER: BookingStatus.VEHICLE_RETURN,
  VEHICLE_RECEIPT_CONFIRMED: BookingStatus.VEHICLE_RETURN,
  SERVICE_COMPLETE: BookingStatus.SERVICE_COMPLETE,
};

// The stage of one of the API's status codes; null for a code the app doesn't know
export const statusStage = (code: string): BookingStatus | null => statusStages[code] ?? null;

// "ADVISOR_ASSIGNED" -> "Advisor Assigned"
const statusName =(code: string) =>
  code
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

function toServiceStatus(response: StatusSummaryResponse): ServiceStatus {
  return {
    id: response.bmsId,
    code: response.currentStatus,
    status: statusStages[response.currentStatus] ?? null,
    // The status the booking is actually at. The API's own `label` groups
    // several statuses under one name ("Vehicle Arrived" for ADVISOR_ASSIGNED),
    // so it isn't used.
    label: statusName(response.currentStatus),
    doneAt: response.doneAt,
    previousStatus: response.previousStatus,
  };
}

function toCustomerDetails(response: CustomerDetailsResponse): CustomerBookingDetails {
  const items = (response.invoiceItems ?? []).map((item) => ({
    description: item.description,
    amount: Number(item.amount),
  }));

  return {
    id: response.bmsId,
    dealershipName: response.dealershipName,
    vehicle: response.vehicle,
    vehicleYear: response.vehicleYear,
    vehicleMake: response.vehicleMake,
    vehicleModel: response.vehicleModel,
    vin: response.vin,
    maskedVin: response.maskedVin,
    miles: formatMiles(response.mileage),
    service: response.service,
    scheduled: response.scheduled,
    bookingDate: response.bookingDate,
    code: response.bookingStatus,
    isDriveable: response.isDriveable,
    towRequested: response.towRequested,
    pickupAddress: response.pickupAddress,
    customerName: response.customerName,
    customerPhone: response.customerPhone,
    invoice:
      response.invoiceTotal != null
        ? {
            total: Number(response.invoiceTotal),
            currency: response.invoiceCurrency ?? "USD",
            items,
            generatedAt: response.invoiceGeneratedAt,
          }
        : null,
  };
}

// A booking of GET booking/list
interface BookingListItem {
  bmsId: string;
  dealershipName: string;
  vehicle: string;
  service: string;
  scheduled: string;
  bookingStatus: string;
  statusLabel: string;
}

// Only SERVICE_COMPLETE has been seen for a booking that's over; a cancelled
// one is taken to say so in its status
const isOpenStatus = (code: string) => code !== "SERVICE_COMPLETE" && !code.includes("CANCEL");

// Customer-side booking endpoints
export const bookingApi = {
  // The booking is made with the real API. The mock keeps a copy under the same
  // id for the steps it still answers (paying the bill).
  create: async ({ vehicleId, dealershipId, addressId, ...booking }: CreateBookingInput) => {
    const saved = await request<SaveBookingResponse>("post", "booking/save", {
      vehicleId,
      dealershipId,
      ...toAppointment(booking.scheduledAt),
      addressId,
      serviceDescription: booking.concern.trim() || null,
      // Every booking asks for a loaner
      loanerRequested: true,
      isDriveable: booking.driveable,
      towRequested: !booking.driveable && booking.towTruck !== false,
      bookingType: bookingTypes[booking.serviceId],
    });

    if (USE_MOCK_API) mockServer.createBooking(booking, saved.bmsId);

    return {
      id: saved.bmsId,
      // A new booking always waits for the dealership to confirm it
      status: BookingStatus.IN_QUEUE,
      createdAt: new Date().toISOString(),
    };
  },

  // Real API: all of the customer's bookings, newest first
  list: async (): Promise<BookingSummary[]> => {
    const { bookings } = await request<{ bookings: BookingListItem[] }>("get", "booking/list");
    return bookings.map((booking) => ({
      id: booking.bmsId,
      dealershipName: booking.dealershipName,
      vehicle: booking.vehicle,
      scheduled: booking.scheduled,
      code: booking.bookingStatus,
      status: statusStages[booking.bookingStatus] ?? null,
      label: statusName(booking.bookingStatus),
      open: isOpenStatus(booking.bookingStatus),
    }));
  },

  // Real API: where a booking stands
  getStatus: async (id: string): Promise<ServiceStatus> =>
    toServiceStatus(
      await request<StatusSummaryResponse>("get", `booking/customer/${id}/status-summary`),
    ),

  // Real API: what was booked (vehicle, pickup, dealership, customer, bill)
  getDetails: async (id: string): Promise<CustomerBookingDetails> =>
    toCustomerDetails(
      await request<CustomerDetailsResponse>("get", `booking/customer/${id}/details`),
    ),

  // Real API: the customer withdraws a booking (the API decides whether it still
  // can be). The mock drops its copy too.
  cancel: async (id: string) => {
    await request("post", `booking/cancel/${id}`);
    if (USE_MOCK_API) mockServer.removeBooking(id);
    return { id };
  },

  // Pays the generated invoice
  pay: (id: string) =>
    callApi(
      () => mockServer.payInvoice(id),
      () => request<AdminBooking>("post", `/bookings/${id}/pay`),
    ),
};
