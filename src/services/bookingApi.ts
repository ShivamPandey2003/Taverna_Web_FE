import { USE_MOCK_API, request } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import { formatMiles } from "./vehicleApi";
import {
  BookingStatus,
  type BookingSummary,
  type ConfirmationAnswer,
  type CustomerBookingDetails,
  type ServiceStatus,
  type StaffContact,
  type StaffNeed,
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
  // null when there's nothing to confirm; its other shapes are a guess, see
  // readConfirmation
  user_confirmation?: unknown;
  currentStatus: string;
  label: string;
  doneAt: string | null;
  previousStatus: string | null;
}

const ANSWERS = ["APPROVED", "REJECTED"];

const textField = (value: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    if (typeof value[key] === "string" && value[key]) return value[key] as string;
  }
  return null;
};

// Whether the customer has to answer. null means nothing to confirm. Any other
// value is read tolerantly, since only null has been seen: an answer
// ("APPROVED" / "REJECTED") means it's done; anything else (an object,
// "PENDING", ...) is a request, with its text if it has some.
function readConfirmation(
  summary: StatusSummaryResponse,
): Pick<ServiceStatus, "needsConfirmation" | "confirmationPrompt"> {
  const value = summary.user_confirmation;
  if (value == null) return { needsConfirmation: false, confirmationPrompt: null };
  if (typeof value === "string") {
    return { needsConfirmation: !ANSWERS.includes(value.toUpperCase()), confirmationPrompt: null };
  }
  if (typeof value === "object") {
    const fields = value as Record<string, unknown>;
    const answered = textField(fields, "status", "confirmation", "answer");
    if (answered && ANSWERS.includes(answered.toUpperCase())) {
      return { needsConfirmation: false, confirmationPrompt: null };
    }
    return {
      needsConfirmation: true,
      confirmationPrompt: {
        title: textField(fields, "title", "heading", "label"),
        message: textField(fields, "message", "description", "body"),
      },
    };
  }
  return { needsConfirmation: true, confirmationPrompt: null };
}

// GET booking/:bmsId/staff-details/valet-operator and …/advisor
interface ValetDetailsResponse {
  bmsId: string;
  pickupValetFullName: string | null;
  pickupValetPhone: string | null;
  deliveryValetFullName: string | null;
  deliveryValetPhone: string | null;
}

interface AdvisorDetailsResponse {
  bmsId: string;
  advisorFullName: string | null;
  advisorPhone: string | null;
}

// Null until someone is assigned
const toStaffContact = (name: string | null, phone: string | null): StaffContact | null =>
  name ? { name, phone: phone ?? "" } : null;

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
  // Not seen yet: read in case the details start saying the bill is paid
  paymentStatus?: string | null;
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
  // The customer drives in themselves (Customer Drop In): the pickup's colour,
  // though no valet comes (see CUSTOMER_DRIVES_IN)
  CUSTOMER_IN: BookingStatus.VALET_ASSIGNED,
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
  PAYMENT_VERIFICATION_PENDING: BookingStatus.BILL_GENERATED,
  PAYMENT_CONFIRMED: BookingStatus.VEHICLE_RETURN,
  READY_FOR_DISPATCH: BookingStatus.VEHICLE_RETURN,
  // The delivery valet's whole trip is the way back (teal), never the pickup
  // valet's blue "on the road"
  DELIVERY_VALET_ASSIGNED: BookingStatus.VEHICLE_RETURN,
  DELIVERY_VALET_DISPATCHED: BookingStatus.VEHICLE_RETURN,
  DELIVERY_VEHICLE_PICKED_UP: BookingStatus.VEHICLE_RETURN,
  DELIVERY_VALET_ARRIVED_AT_CUSTOMER: BookingStatus.VEHICLE_RETURN,
  VEHICLE_DELIVERED: BookingStatus.VEHICLE_RETURN,
  SELF_COLLECTION_HANDED_OVER: BookingStatus.VEHICLE_RETURN,
  // The customer collects it themselves (Customer Drop Off): the way back's colour
  CUSTOMER_DROP_OFF: BookingStatus.VEHICLE_RETURN,
  VEHICLE_RECEIPT_CONFIRMED: BookingStatus.VEHICLE_RETURN,
  SERVICE_COMPLETE: BookingStatus.SERVICE_COMPLETE,
};

// The stage of one of the API's status codes; null for a code the app doesn't know
export const statusStage = (code: string): BookingStatus | null => statusStages[code] ?? null;

// The customer brings the vehicle in themselves: it has the pickup's colour, but
// the tracking page keeps the booking details instead of a valet's map
export const CUSTOMER_DRIVES_IN = "CUSTOMER_IN";

// The statuses during which the customer is shown the valet of a leg, or the
// advisor; at any other status nobody is shown and staff-details isn't called
const PICKUP_VALET_STATUSES = [
  "VALET_ASSIGNED",
  "VALET_DISPATCHED",
  "VALET_ARRIVED_AT_CUSTOMER",
  "VEHICLE_HANDED_OVER_TO_VALET",
  "VALET_PICKUP_CONFIRMED",
  "VEHICLE_PICKED_UP",
];
const DELIVERY_VALET_STATUSES = [
  "DELIVERY_VALET_ASSIGNED",
  "DELIVERY_VALET_DISPATCHED",
  "DELIVERY_VEHICLE_PICKED_UP",
  "DELIVERY_VALET_ARRIVED_AT_CUSTOMER",
  "VEHICLE_DELIVERED",
];
const ADVISOR_STATUSES = [
  "ADVISOR_ASSIGNED",
  "VEHICLE_IN_INSPECTION",
  "INSPECTION_COMPLETED",
  "INSPECTION_APPROVED",
  "VEHICLE_IN_SERVICE",
  "SERVICE_COMPLETED",
  "INVOICE_GENERATED",
  "PAYMENT_VERIFICATION_PENDING",
  "PAYMENT_CONFIRMED",
  "READY_FOR_DISPATCH",
];

export function staffNeeded(code: string): StaffNeed | null {
  if (PICKUP_VALET_STATUSES.includes(code)) return { type: "valet", leg: "pickup" };
  if (DELIVERY_VALET_STATUSES.includes(code)) return { type: "valet", leg: "delivery" };
  if (ADVISOR_STATUSES.includes(code)) return { type: "advisor" };
  return null;
}

// "ADVISOR_ASSIGNED" -> "Advisor Assigned"
export const statusName = (code: string) =>
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
    // The API's own label ("Vehicle Arrived"); the code spelled out without one
    label: response.label?.trim() || statusName(response.currentStatus),
    apiLabel: response.label?.trim() || null,
    doneAt: response.doneAt,
    previousStatus: response.previousStatus,
    ...readConfirmation(response),
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
            paid: response.paymentStatus === "PAID",
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
  vin: string | null;
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
      vin: booking.vin ?? "",
      scheduled: booking.scheduled,
      code: booking.bookingStatus,
      status: statusStages[booking.bookingStatus] ?? null,
      label: booking.statusLabel?.trim() || statusName(booking.bookingStatus),
      open: isOpenStatus(booking.bookingStatus),
    }));
  },

  // Real API: where a booking stands
  getStatus: async (id: string): Promise<ServiceStatus> =>
    toServiceStatus(
      await request<StatusSummaryResponse>("get", `booking/customer/${id}/status-summary`),
    ),

  // Real API: the valet of one leg, or the advisor (null until assigned)
  getStaff: async (id: string, need: StaffNeed): Promise<StaffContact | null> => {
    if (need.type === "advisor") {
      const advisor = await request<AdvisorDetailsResponse>(
        "get",
        `booking/${id}/staff-details/advisor`,
      );
      return toStaffContact(advisor.advisorFullName, advisor.advisorPhone);
    }

    const valets = await request<ValetDetailsResponse>(
      "get",
      `booking/${id}/staff-details/valet-operator`,
    );
    return need.leg === "pickup"
      ? toStaffContact(valets.pickupValetFullName, valets.pickupValetPhone)
      : toStaffContact(valets.deliveryValetFullName, valets.deliveryValetPhone);
  },

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

  // Real API: the customer approves or rejects the step waiting for them (the
  // pickup, the inspection, the delivery). POST is a guess at the method; the
  // answer isn't known, so it isn't read.
  confirm: (id: string, confirmation: ConfirmationAnswer) =>
    request<unknown>("post", `booking/confirmation/${id}`, { confirmation }),

  // Real API: opens a Stripe checkout for the bill the advisor sent. The customer
  // pays on Stripe's page; the API then moves the status on (polled).
  checkout: (id: string) =>
    request<CheckoutResponse>("post", `booking/${id}/checkout`),
};

// POST booking/:bmsId/checkout
interface CheckoutResponse {
  bmsId: string;
  checkoutUrl: string;
  expiresAt: string;
}
