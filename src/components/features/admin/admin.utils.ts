import { BookingStatus } from "@/types/booking";
import type {
  AdminBooking,
  AdvisorMilestone,
  ValetLeg,
  ValetMilestone,
} from "@/types/admin";
import type { ServiceId } from "@/types/service";
import { WORKFLOW_STEPS, type WorkflowStep } from "@/redux/modals/adminModal/adminModalSlice";

export const serviceLabels: Record<ServiceId, string> = {
  "pickup-delivery": "Pickup & Delivery",
  "loaner-only": "Loaner Only",
};

export const bookingStatuses = Object.values(BookingStatus);

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

// What each valet milestone means on each trip
export const valetMilestoneLabels: Record<ValetLeg, Record<ValetMilestone, string>> = {
  pickup: {
    dispatched: "Valet dispatched",
    arrived: "Arrived at customer",
    pickedUp: "Picked up vehicle",
    enRoute: "Heading to dealership",
    reached: "Arrived at dealership",
    delivered: "Handed to dealership",
  },
  delivery: {
    dispatched: "Valet dispatched",
    arrived: "Arrived at dealership",
    pickedUp: "Picked up vehicle",
    enRoute: "Heading to customer",
    reached: "Arrived at customer",
    delivered: "Delivered to customer",
  },
};

// Service updates the advisor shares with the customer
export const advisorMilestoneLabels: Record<AdvisorMilestone, string> = {
  checkedIn: "Vehicle checked in",
  inService: "Service started",
  serviceDone: "Service finished",
};

export const legTitles: Record<ValetLeg, string> = {
  pickup: "Pickup valet",
  delivery: "Delivery valet",
};

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

// A trip is done once the vehicle is handed over at the other end
const tripDone = (booking: AdminBooking, leg: ValetLeg) => {
  const { valet, progress } = valetTrip(booking, leg);
  return !!valet && !!progress.delivered;
};

// Personal link the staff member opens to post updates for this booking
export function staffLink(bookingId: string, leg: ValetLeg | "advisor") {
  const path = leg === "advisor" ? `advisor/${bookingId}` : `valet/${leg}/${bookingId}`;
  return `${window.location.origin}/${path}`;
}

export const isComplete = (booking: AdminBooking) =>
  booking.status === BookingStatus.SERVICE_COMPLETE;

// A step is done once everything in it has happened
export function isStepDone(booking: AdminBooking, step: WorkflowStep) {
  switch (step) {
    case "confirm":
      return !!booking.confirmedAt;
    case "pickup":
      return tripDone(booking, "pickup");
    case "advisor":
      // The advisor's part ends with the customer paying the bill
      return !!booking.relationshipManager && booking.payment?.status === "paid";
    case "delivery":
      return tripDone(booking, "delivery");
    case "complete":
      return isComplete(booking);
  }
}

// Steps unlock in order: each one needs every earlier step done. A complete
// booking is locked to its summary.
export function isStepUnlocked(booking: AdminBooking, step: WorkflowStep) {
  if (isComplete(booking)) return step === "complete";
  const index = WORKFLOW_STEPS.indexOf(step);
  return WORKFLOW_STEPS.slice(0, index).every((previous) => isStepDone(booking, previous));
}

export function firstOpenStep(booking: AdminBooking): WorkflowStep {
  return WORKFLOW_STEPS.find((step) => !isStepDone(booking, step)) ?? "complete";
}
