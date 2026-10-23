// import { Lock } from "reicon-react";
import { vehicleName } from "@/libs/utils";
import { Drawer } from "@/components/ui/Drawer";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeAddStaff,
  closeBookingWorkflow,
  selectAdminModal,
  setWorkflowStep,
  WORKFLOW_STEPS,
  type WorkflowStep,
} from "@/redux/modals/adminModal/adminModalSlice";
import { useAdminBooking } from "@/services/queries/adminQueries";
import { BookingStatusBadge } from "../BookingStatusBadge";
import { firstOpenStep, isStepUnlocked, serviceLabels } from "../admin.utils";
import { WorkflowStepper } from "./WorkflowStepper";
import { ConfirmStep } from "./ConfirmStep";
import { TransferStep } from "./TransferStep";
import { AdvisorStep } from "./AdvisorStep";
import { CompleteStep } from "./CompleteStep";
import { CopyButton } from "./StepParts";
import { StaffFormModal } from "@/components/features/staff/StaffFormModal";

// Confirm → pickup valet → advisor → delivery valet → complete, in a drawer from
// the right. Each step unlocks once the one before it is finished.
export function BookingWorkflowDrawer() {
  const dispatch = useAppDispatch();
  const { workflowBookingId, activeStep, addStaff } = useAppSelector(selectAdminModal);
  const { data: booking, isPending, isError } = useAdminBooking(workflowBookingId);

  if (!workflowBookingId) {
    return null;
  }

  const onClose = () => dispatch(closeBookingWorkflow());

  // Opens on the first unfinished step unless the admin picked one. A picked step
  // that is locked (e.g. left over from another booking) falls back as well.
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
          {booking && <BookingStatusBadge status={booking.status} code={booking.journey?.current} label={booking.journey?.statusLabel} size="md" />}
        </>
      }
      subtitle={
        <>
          <span className="shrink-0 font-semibold text-gray-900">{workflowBookingId}</span>
          <CopyButton value={workflowBookingId} label="booking ID" />
          {booking && (
            <>
              <span className="truncate">
                · {booking.customer.name} - {vehicleName(booking.vehicle)}
              </span>
              {/* Booking type: the service that was booked */}
              <span className="ml-1.5 inline-flex shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold text-gray-700 ring-1 ring-inset ring-gray-200">
                {serviceLabels[booking.serviceId]}
              </span>
            </>
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

          {/* {isComplete(booking) && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <Lock size={15} className="shrink-0 text-gray-400" />
              This service is complete. You can look through every step, but nothing can be
              changed.
            </p>
          )} */}

          {/* Keyed so each step's local state starts fresh, also when a row click
              switches the drawer to another booking */}
          <div key={`${booking.id}-${step}`}className="mt-5 border-t border-gray-200 pt-5">
            {step === "confirm" && (
              <ConfirmStep booking={booking} onDone={() => goToNextStep("confirm")} />
            )}
            {step === "pickup" && (
              <TransferStep booking={booking} leg="pickup" onDone={() => goToNextStep("pickup")} />
            )}
            {step === "advisor" && (
              <AdvisorStep booking={booking} onDone={() => goToNextStep("advisor")} />
            )}
            {step === "delivery" && (
              <TransferStep
                booking={booking}
                leg="delivery"
                onDone={() => goToNextStep("delivery")}
              />
            )}
            {step === "complete" && <CompleteStep booking={booking} />}
          </div>
        </>
      )}

      {/* Opened from the assign steps' dropdown. Over the drawer only, like the
          assign confirmation, so the bookings table stays visible. */}
      <StaffFormModal
        open={!!addStaff}
        role={addStaff?.role ?? "valet"}
        defaultName={addStaff?.name}
        onClose={() => dispatch(closeAddStaff())}
        contained
      />
    </Drawer>
  );
}
