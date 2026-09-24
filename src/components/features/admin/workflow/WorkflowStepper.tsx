import { Check } from "reicon-react";
import { cn } from "@/libs/utils";
import { WORKFLOW_STEPS, type WorkflowStep } from "@/redux/modals/adminModal/adminModalSlice";
import type { AdminBooking } from "@/types/admin";
import { isStepDone, isStepUnlocked } from "../admin.utils";

const stepLabels: Record<WorkflowStep, string> = {
  confirm: "Confirm booking",
  valet: "Assign valet",
  manager: "Relationship manager",
  payment: "Payment",
};

interface WorkflowStepperProps {
  booking: AdminBooking;
  activeStep: WorkflowStep;
  onSelect: (step: WorkflowStep) => void;
}

export function WorkflowStepper({ booking, activeStep, onSelect }: WorkflowStepperProps) {
  return (
    <ol className="grid grid-cols-4 gap-2">
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
              className={cn(
                "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition",
                active
                  ? "border-gray-900 bg-white"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300",
                !unlocked && "cursor-not-allowed opacity-50 hover:border-gray-200",
              )}
              title={unlocked ? undefined : "Finish the previous step first"}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 text-gray-600",
                )}
              >
                {done ? <Check size={13} strokeWidth={3} /> : index + 1}
              </span>

              <span className="text-xs font-semibold leading-4 text-gray-900">
                {stepLabels[step]}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
