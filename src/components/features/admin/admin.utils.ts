import { BookingStatus } from "@/types/booking";
import {
  TRIP_END,
  type AdminBooking,
  type AdvisorMilestone,
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

// What each valet milestone means on each trip. The pickup trip only uses the
// ones in LEG_MILESTONES.pickup.
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

// Updates the advisor shares with the customer
export const advisorMilestoneLabels: Record<AdvisorMilestone, string> = {
  inspecting: "Inspecting car",
  inspected: "Inspection done",
  inService: "Service in progress",
  serviceDone: "Service done",
  readyForDispatch: "Ready to dispatch",
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

// A trip is done once its last milestone is posted
const tripDone = (booking: AdminBooking, leg: ValetLeg) => {
  const { valet, progress } = valetTrip(booking, leg);
  return !!valet && !!progress[TRIP_END[leg]];
};

// Personal link the staff member opens to post updates for this booking. Staff
// never log in: the token at the end of the path signs them in. Must match the
// staff routes in routes/index.tsx.
export function staffLink(booking: AdminBooking, role: StaffLinkRole) {
  const token = booking.staffTokens?.[role];
  if (!token) return null;
  const path = role === "advisor" ? `advisor/${booking.id}` : `valet/${role}/${booking.id}`;
  return `${window.location.origin}/${path}/${encodeURIComponent(token)}`;
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
      // The advisor's part ends with the paid-up vehicle ready for the delivery valet
      return !!booking.relationshipManager && !!booking.advisorProgress?.readyForDispatch;
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
