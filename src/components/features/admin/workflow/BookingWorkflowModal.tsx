import { X } from "reicon-react";
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
import { BookingOverview } from "./BookingOverview";
import { WorkflowStepper } from "./WorkflowStepper";
import { ConfirmStep } from "./ConfirmStep";
import { AssignValetStep, AssignManagerStep } from "./AssignStaffSteps";
import { PaymentStep } from "./PaymentStep";

export function BookingWorkflowModal() {
  const dispatch = useAppDispatch();
  const { selectedBookingId, activeStep } = useAppSelector(selectAdminModal);
  const { data: booking, isPending, isError } = useAdminBooking(selectedBookingId);

  if (!selectedBookingId) {
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
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal wrapper */}
      <div className="relative flex h-full items-center justify-center p-6">
        {/* Modal */}
        <div
          className="relative flex max-h-full w-full max-w-[760px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-gray-900">
                Booking {selectedBookingId}
              </h2>
              {booking && <BookingStatusBadge status={booking.status} />}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-5">
            {isPending && (
              <div className="space-y-3">
                <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
                <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
                <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
              </div>
            )}

            {isError && (
              <p className="py-10 text-center text-sm text-gray-500">
                Couldn't load this booking.
              </p>
            )}

            {booking && (
              <>
                <BookingOverview booking={booking} />

                <div className="mt-6">
                  <WorkflowStepper
                    booking={booking}
                    activeStep={step}
                    onSelect={(next) => dispatch(setWorkflowStep(next))}
                  />
                </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
