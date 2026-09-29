import { Check, Lock } from "reicon-react";
import { cn } from "@/libs/utils";
import { WORKFLOW_STEPS, type WorkflowStep } from "@/redux/modals/adminModal/adminModalSlice";
import type { AdminBooking } from "@/types/admin";
import { isComplete, isStepDone, isStepUnlocked } from "../admin.utils";

// What's left to do on each step
const stepLabels: Record<WorkflowStep, string> = {
  confirm: "Confirm Booking",
  pickup: "Assign Pickup Valet",
  advisor: "Assign Advisor",
  delivery: "Assign Delivery Valet",
  complete: "Service Complete",
};

// What a finished step holds once there's nothing left to do on it
const doneLabels: Record<WorkflowStep, string> = {
  confirm: "Booking Details",
  pickup: "Pickup Valet",
  advisor: "Advisor",
  delivery: "Delivery Valet",
  complete: "Service Completed",
};

interface WorkflowStepperProps {
  booking: AdminBooking;
  activeStep: WorkflowStep;
  onSelect: (step: WorkflowStep) => void;
}

// One card per step. A step opens only once every step before it is finished,
// and a completed booking stays on its last step.
export function WorkflowStepper({ booking, activeStep, onSelect }: WorkflowStepperProps) {
  const complete = isComplete(booking);

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {WORKFLOW_STEPS.map((step, index) => {
        const done = isStepDone(booking, step);
        const unlocked = isStepUnlocked(booking, step);
        const active = step === activeStep;

        return (
          <li key={step}>
            <button
              type="button"
              disabled={!unlocked}
              onClick={() => onSelect(step)}
              title={
                unlocked
                  ? undefined
                  : complete
                    ? "The service is complete"
                    : "Finish the previous step first"
              }
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-center transition",
                // A finished step stays green even while it's open, like the others
                done
                  ? "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300"
                  : active
                    ? "border-gray-900 bg-white"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300",
                !unlocked && "cursor-not-allowed opacity-60 hover:border-gray-200",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done
                    ? "bg-status-active text-white"
                    : active
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-600",
                )}
              >
                {done ? (
                  <Check size={13} strokeWidth={3} />
                ) : unlocked ? (
                  index + 1
                ) : (
                  <Lock size={12} />
                )}
              </span>

              <span className="text-xs font-semibold leading-4 text-gray-900">
                {done ? doneLabels[step] : stepLabels[step]}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
