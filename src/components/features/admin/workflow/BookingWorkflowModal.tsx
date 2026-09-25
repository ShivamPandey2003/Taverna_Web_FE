import { Modal } from "@/components/ui/Modal";
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
import { firstOpenStep } from "../admin.utils";
import { WorkflowStepper } from "./WorkflowStepper";
import { ConfirmStep } from "./ConfirmStep";
import { AssignValetStep, AssignManagerStep } from "./AssignStaffSteps";
import { PaymentStep } from "./PaymentStep";

// Confirm → assign valet → assign relationship manager → payment.
// The booking's details are in BookingDetailsModal.
export function BookingWorkflowModal() {
  const dispatch = useAppDispatch();
  const { workflowBookingId, activeStep } = useAppSelector(selectAdminModal);
  const { data: booking, isPending, isError } = useAdminBooking(workflowBookingId);

  if (!workflowBookingId) {
    return null;
  }

  const onClose = () => dispatch(closeBookingWorkflow());

  // Opens on the first unfinished step unless the admin picked one
  const step = activeStep ?? (booking ? firstOpenStep(booking) : "confirm");

  const goToNextStep = (current: WorkflowStep) => {
    const next = WORKFLOW_STEPS[WORKFLOW_STEPS.indexOf(current) + 1];
    if (next) dispatch(setWorkflowStep(next));
  };

  return (
    <Modal
      title={
        <>
          <h2>Manage {workflowBookingId}</h2>
          {booking && <BookingStatusBadge status={booking.status} />}
        </>
      }
      subtitle={
        booking &&
        `${booking.customer.name} · ${booking.vehicle.year} ${booking.vehicle.brand} ${booking.vehicle.model}`
      }
      onClose={onClose}
    >
      {isPending && (
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
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

          {/* Keyed so each step's local form state starts fresh */}
          <div key={step} className="mt-5">
            {step === "confirm" && (
              <ConfirmStep booking={booking} onDone={() => goToNextStep("confirm")} />
            )}
            {step === "valet" && (
              <AssignValetStep booking={booking} onDone={() => goToNextStep("valet")} />
            )}
            {step === "manager" && (
              <AssignManagerStep booking={booking} onDone={() => goToNextStep("manager")} />
            )}
            {step === "payment" && <PaymentStep booking={booking} />}
          </div>
        </>
      )}
    </Modal>
  );
}
