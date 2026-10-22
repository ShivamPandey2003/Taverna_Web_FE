import { BookingStatus } from "@/types/booking";
import {
  defaultLegMethod,
  HANDOVER_DELIVERED,
  INTAKE_CONFIRMED,
  journeyIntakeDone,
  journeyHandoverMethod,
  journeyIntakeMethod,
  journeyReached,
  SERVICE_PAID,
  TRIP_END,
  type AdminBooking,
  type AdvisorMilestone,
  type IntakeMethod,
  type StaffLinkRole,
  type ValetLeg,
  type ValetMilestone,
} from "@/types/admin";
import type { ServiceId } from "@/types/service";
import { WORKFLOW_STEPS, type WorkflowStep } from "@/redux/modals/adminModal/adminModalSlice";

export const serviceLabels: Record<ServiceId, string> = {
  "pickup-delivery": "Pickup & Delivery",
  "loaner-only": "Loaner Only",
};

// The bookings table's status filter: the API's status codes (sent as they are)
// with the names the API shows for them, in the order a booking goes through
// them, grouped by stage since the two valets' statuses share their names.
// Service Complete is left out (by request): finished bookings aren't filtered for.
export const bookingStatusFilters: { group: string; options: { code: string; label: string }[] }[] = [
  {
    group: "Booking",
    options: [
      { code: "IN_QUEUE", label: "In Queue" },
      { code: "BOOKED", label: "Booked" },
    ],
  },
  {
    group: "Vehicle Intake",
    options: [
      { code: "VALET_ASSIGNED", label: "Valet Ready" },
      { code: "VALET_DISPATCHED", label: "Valet EnRoute" },
      { code: "VALET_ARRIVED_AT_CUSTOMER", label: "Valet Arrived" },
      { code: "VALET_PICKUP_CONFIRMED", label: "Pickup Booked" },
      { code: "VEHICLE_PICKED_UP", label: "Pickup EnRoute" },
      { code: "TOW_ASSIGNED", label: "Tow Booked" },
      { code: "CUSTOMER_IN", label: "Customer In" },
      { code: "VEHICLE_ARRIVED_AT_DEALERSHIP", label: "At Dealership" },
      { code: "VEHICLE_AT_DEALERSHIP_CONFIRMED", label: "Checked In" },
    ],
  },
  {
    group: "Service",
    options: [
      { code: "ADVISOR_ASSIGNED", label: "Advisor Ready" },
      { code: "VEHICLE_IN_INSPECTION", label: "Inspecting" },
      { code: "VEHICLE_IN_SERVICE", label: "Servicing" },
      { code: "INVOICE_GENERATED", label: "Bill Generated" },
      { code: "PAYMENT_VERIFICATION_PENDING", label: "Verifying Payment" },
      { code: "PAYMENT_CONFIRMED", label: "Payment Verified" },
      { code: "READY_FOR_DISPATCH", label: "Ready" },
    ],
  },
  {
    group: "Vehicle Handover",
    options: [
      { code: "DELIVERY_VALET_ASSIGNED", label: "Valet Ready" },
      { code: "DELIVERY_VALET_DISPATCHED", label: "Valet EnRoute" },
      { code: "DELIVERY_VALET_ARRIVED_AT_CUSTOMER", label: "Valet Arrived" },
      { code: "CUSTOMER_DROP_OFF", label: "Customer Drop Off" },
      { code: "VEHICLE_DELIVERED", label: "Vehicle Delivered" },
    ],
  },
  {
    group: "Other",
    options: [{ code: "CANCELLED", label: "Cancelled" }],
  },
];

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Compact form for table cells; the year only shows when it isn't the current one
export function formatShortDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() !== new Date().getFullYear() && { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number) {
  return amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// What each valet milestone means on each trip. The pickup trip only uses the
// ones in LEG_MILESTONES.pickup.
export const valetMilestoneLabels: Record<ValetLeg, Record<ValetMilestone, string>> = {
  pickup: {
    dispatched: "Valet Dispatched",
    arrived: "Arrived at Customer",
    pickedUp: "Picked Up Vehicle",
    enRoute: "Heading to Dealership",
    reached: "Arrived at Dealership",
    delivered: "Handed to Dealership",
  },
  delivery: {
    dispatched: "Valet Dispatched",
    arrived: "Arrived at Dealership",
    pickedUp: "Picked Up Vehicle",
    enRoute: "Heading to Customer",
    reached: "Arrived at Customer",
    delivered: "Delivered to Customer",
  },
};

// Updates the advisor shares with the customer
export const advisorMilestoneLabels: Record<AdvisorMilestone, string> = {
  inspecting: "Vehicle in Inspection",
  inService: "Vehicle in Service",
  readyForDispatch: "Ready to Dispatch",
};

export const legTitles: Record<ValetLeg, string> = {
  pickup: "Pickup Valet",
  delivery: "Delivery Valet",
};

// How each way of making a trip reads: the customer drops the vehicle in at the
// dealership on the way in, and it's dropped off with them on the way back
const legMethodLabels: Record<ValetLeg, Record<IntakeMethod, string>> = {
  pickup: { valet: "Valet", towTruck: "Tow Truck", selfDrive: "Customer Drop In" },
  delivery: { valet: "Valet", towTruck: "Tow Truck", selfDrive: "Customer Drop Off" },
};

export const methodLabel = (leg: ValetLeg, method: IntakeMethod) => legMethodLabels[leg][method];

// How the vehicle makes a trip: what the admin picked (kept only in this
// browser), else for the way in what the API's journey says (journeyIntakeMethod),
// else "valet" for a booking that already has the trip's valet, else what the
// booking starts with (defaultLegMethod). null when the admin still has to pick.
export function legMethod(booking: AdminBooking, leg: ValetLeg): IntakeMethod | null {
  // The API's CUSTOMER_DROP_OFF on the way back beats a choice stored elsewhere
  if (leg === "delivery") {
    const handover = journeyHandoverMethod(booking);
    if (handover) return handover;
  }
  const saved = leg === "pickup" ? booking.intakeMethod : booking.handoverMethod;
  if (saved) return saved;
  const fromApi = leg === "pickup" ? journeyIntakeMethod(booking) : null;
  if (fromApi) return fromApi;
  if (valetTrip(booking, leg).valet) return "valet";
  return defaultLegMethod(booking, leg);
}

// The valet and milestone log of one trip
export function valetTrip(booking: AdminBooking, leg: ValetLeg) {
  return leg === "pickup"
    ? { valet: booking.valet, progress: booking.pickupProgress ?? {} }
    : { valet: booking.deliveryValet ?? null, progress: booking.deliveryProgress ?? {} };
}

export function nextMilestone<T extends string>(
  order: readonly T[],
  log: Partial<Record<T, string>>,
) {
  return order.find((key) => !log[key]) ?? null;
}

// A trip is done once its last milestone is posted
// A trip is done once the vehicle is at the other end: taken by the valet (their
// last milestone), a tow truck or the customer (confirmed by the admin)
const tripDone = (booking: AdminBooking, leg: ValetLeg) => {
  // The API says the vehicle is in: done, however it came (a tow truck chosen in
  // another browser leaves this one guessing the method)
  if (leg === "pickup" && booking.journey && journeyIntakeDone(booking.journey)) return true;
  const { valet, progress } = valetTrip(booking, leg);
  const method = legMethod(booking, leg);
  if (!method || (method === "valet" && !valet)) return false;
  // Read off the API's journey. The intake, by valet or tow truck, isn't over
  // until the admin confirms the vehicle was received; a valet's delivery is over
  // once the vehicle is delivered.
  if (booking.journey && leg === "pickup" && method !== "selfDrive") {
    return journeyReached(booking.journey, INTAKE_CONFIRMED);
  }
  if (booking.journey && method === "valet") {
    return journeyReached(booking.journey, HANDOVER_DELIVERED);
  }
  return !!progress[TRIP_END[leg]];
};

// The link the staff member opens to post updates for this booking: the page
// alone, with nothing in it that signs them in (they sign in there with email +
// OTP). Must match the staff routes in routes/index.tsx.
export function staffLink(booking: AdminBooking, role: StaffLinkRole) {
  const path = role === "advisor" ? `advisor/${booking.id}` : `valet/${role}/${booking.id}`;
  return `${window.location.origin}/${path}`;
}

export const isComplete = (booking: AdminBooking) =>
  booking.status === BookingStatus.SERVICE_COMPLETE;

// The API's status is a cancelled one (CANCELLED, ..._CANCELLED): there's
// nothing left to confirm or assign
export const isCancelled = (booking: AdminBooking) =>
  /cancel/i.test(booking.journey?.current ?? "") ||
  /cancel/i.test(booking.journey?.statusLabel ?? "");

// A step is done once everything in it has happened
export function isStepDone(booking: AdminBooking, step: WorkflowStep) {
  switch (step) {
    case "confirm":
      return !!booking.confirmedAt;
    case "pickup":
      return tripDone(booking, "pickup");
    case "advisor":
      // The advisor's part ends once the admin confirms the payment
      if (!booking.relationshipManager) return false;
      return booking.journey
        ? journeyReached(booking.journey, SERVICE_PAID)
        : !!booking.advisorProgress?.readyForDispatch;
    case "delivery":
      return tripDone(booking, "delivery");
    case "complete":
      return isComplete(booking);
  }
}

// Steps unlock in order: each one needs every earlier step done. On a complete
// booking every step is done, so they all open, read-only.
export function isStepUnlocked(booking: AdminBooking, step: WorkflowStep) {
  const index = WORKFLOW_STEPS.indexOf(step);
  return WORKFLOW_STEPS.slice(0, index).every((previous) => isStepDone(booking, previous));
}

export function firstOpenStep(booking: AdminBooking): WorkflowStep {
  return WORKFLOW_STEPS.find((step) => !isStepDone(booking, step)) ?? "complete";
}
