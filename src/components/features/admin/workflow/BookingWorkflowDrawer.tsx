import { Drawer } from "@/components/ui/Drawer";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeBookingWorkflow,
  selectAdminModal,
  setWorkflowStep,
  WORKFLOW_STEPS,
  type WorkflowStep,
} from "@/redux/modals/adminModal/adminModalSlice";
import { useAdminBooking } from "@/services/queries/adminQueries";
import { BookingStatusBadge } from "../BookingStatusBadge";
import { firstOpenStep, isStepUnlocked } from "../admin.utils";
import { WorkflowStepper } from "./WorkflowStepper";
import { ConfirmStep } from "./ConfirmStep";
import { ValetStep } from "./ValetStep";
import { AdvisorStep } from "./AdvisorStep";
import { CompleteStep } from "./CompleteStep";
import { CopyButton } from "./StepParts";

// Confirm → pickup valet → advisor → delivery valet → complete, in a drawer from
// the right. Each step unlocks once the one before it is finished.
export function BookingWorkflowDrawer() {
  const dispatch = useAppDispatch();
  const { workflowBookingId, activeStep } = useAppSelector(selectAdminModal);
  const { data: booking, isPending, isError } = useAdminBooking(workflowBookingId);

  if (!workflowBookingId) {
    return null;
  }

  const onClose = () => dispatch(closeBookingWorkflow());

  // Opens on the first unfinished step unless the admin picked one. A picked step
  // that is locked (e.g. the service was just completed) falls back as well.
  const step =
    booking && (!activeStep || !isStepUnlocked(booking, activeStep))
      ? firstOpenStep(booking)
      : (activeStep ?? "confirm");

  const goToNextStep = (current: WorkflowStep) => {
    const next = WORKFLOW_STEPS[WORKFLOW_STEPS.indexOf(current) + 1];
    if (next) dispatch(setWorkflowStep(next));
  };

  return (
    <Drawer
      title={
        <>
          <h2>Manage Booking</h2>
          {booking && <BookingStatusBadge status={booking.status} />}
        </>
      }
      subtitle={
        <>
          <span className="shrink-0 font-semibold text-gray-900">{workflowBookingId}</span>
          <CopyButton value={workflowBookingId} label="booking ID" />
          {booking && (
            <span className="truncate">
              · {booking.customer.name} - {booking.vehicle.year} {booking.vehicle.brand}{" "}
              {booking.vehicle.model}
            </span>
          )}
        </>
      }
      onClose={onClose}
    >
      {isPending && (
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-60 animate-pulse rounded-xl bg-gray-100" />
        </div>
      )}

      {isError && (
        <p className="py-10 text-center text-sm text-gray-500">Couldn't load this booking.</p>
      )}

      {booking && (
        <>
          <WorkflowStepper
            booking={booking}
            activeStep={step}
            onSelect={(next) => dispatch(setWorkflowStep(next))}
          />

          {/* Keyed so each step's local state starts fresh */}
          <div key={step} className="mt-5 border-t border-gray-200 pt-5">
            {step === "confirm" && (
              <ConfirmStep booking={booking} onDone={() => goToNextStep("confirm")} />
            )}
            {step === "pickup" && (
              <ValetStep booking={booking} leg="pickup" onDone={() => goToNextStep("pickup")} />
            )}
            {step === "advisor" && (
              <AdvisorStep booking={booking} onDone={() => goToNextStep("advisor")} />
            )}
            {step === "delivery" && (
              <ValetStep
                booking={booking}
                leg="delivery"
                onDone={() => goToNextStep("delivery")}
              />
            )}
            {step === "complete" && <CompleteStep booking={booking} />}
          </div>
        </>
      )}
    </Drawer>
  );
}
