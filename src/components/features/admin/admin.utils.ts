import { BookingStatus } from "@/types/booking";
import type { AdminBooking } from "@/types/admin";
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

// A step is done once the booking carries its data
export function isStepDone(booking: AdminBooking, step: WorkflowStep) {
  switch (step) {
    case "confirm":
      return !!booking.confirmedAt;
    case "valet":
      return !!booking.valet;
    case "manager":
      return !!booking.relationshipManager;
    case "payment":
      return !!booking.payment;
  }
}

// Steps unlock in order: each one needs every earlier step done
export function isStepUnlocked(booking: AdminBooking, step: WorkflowStep) {
  const index = WORKFLOW_STEPS.indexOf(step);
  return WORKFLOW_STEPS.slice(0, index).every((previous) => isStepDone(booking, previous));
}

export function firstOpenStep(booking: AdminBooking): WorkflowStep {
  return WORKFLOW_STEPS.find((step) => !isStepDone(booking, step)) ?? "payment";
}

export function completedStepCount(booking: AdminBooking) {
  return WORKFLOW_STEPS.filter((step) => isStepDone(booking, step)).length;
}
