import { useState } from "react";
import { Car, Driving, Setting2, TickCircle } from "reicon-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Spinner } from "@/components/ui/Spinner";
import { useConfirmStep } from "@/services/queries/bookingQueries";
import type { ConfirmationAnswer, ServiceStatus } from "@/types/booking";

interface StepCopy {
  icon: typeof Car;
  title: string;
  message: string;
  approve: string;
  reject: string;
  // Asked before a rejection is sent
  rejectQuestion: string;
  approved: string;
  rejected: string;
}

// What the customer is asked at each step that waits for them
const copy: Record<string, StepCopy> = {
  VEHICLE_HANDED_OVER_TO_VALET: {
    icon: Car,
    title: "Did you hand your vehicle to the valet?",
    message: "Your valet says they have your vehicle. Confirm it so they can head to the dealership.",
    approve: "Yes, Confirm Pickup",
    reject: "No, I Didn't",
    rejectQuestion: "Tell the dealership you didn't hand your vehicle to the valet?",
    approved: "Pickup confirmed. Your vehicle is on its way to the dealership.",
    rejected: "Thanks for letting us know. The dealership will be in touch.",
  },
  INSPECTION_COMPLETED: {
    icon: Setting2,
    title: "Your inspection is done: approval needed",
    message:
      "Your advisor has inspected your vehicle and needs your go-ahead before starting the work. Call them if you have questions.",
    approve: "Approve Work",
    reject: "Decline",
    rejectQuestion: "Decline the work your advisor recommended?",
    approved: "Approved. Your vehicle's service will start shortly.",
    rejected: "Declined. Your advisor will be in touch.",
  },
  VEHICLE_DELIVERED: {
    icon: Driving,
    title: "Did you get your vehicle back?",
    message: "Your valet says your vehicle has been delivered. Confirm you've received it to complete your service.",
    approve: "Yes, I Received It",
    reject: "No, I Didn't",
    rejectQuestion: "Tell the dealership you haven't received your vehicle?",
    approved: "Thanks! Your service is complete.",
    rejected: "Thanks for letting us know. The dealership will be in touch.",
  },
};

// Any other step the API asks about
const fallback: StepCopy = {
  icon: TickCircle,
  title: "Your confirmation is needed",
  message: "Please confirm this step of your service.",
  approve: "Confirm",
  reject: "Reject",
  rejectQuestion: "Reject this step?",
  approved: "Thanks for confirming.",
  rejected: "Thanks for letting us know. The dealership will be in touch.",
};

// Asks the customer to approve or reject the step their booking is waiting on.
// Shown while the status says so (status.needsConfirmation); the API's own text
// replaces ours when it sends some. Give it `key={status.code}` so an answer
// isn't carried over to the next step.
export function ConfirmationCard({ status }: { status: ServiceStatus }) {
  const confirmStep = useConfirmStep();
  const [rejecting, setRejecting] = useState(false);
  const step = copy[status.code] ?? fallback;
  const Icon = step.icon;
  const title = status.confirmationPrompt?.title ?? step.title;
  const message = status.confirmationPrompt?.message ?? step.message;
  const answering = confirmStep.isPending ? confirmStep.variables?.answer : null;

  // Errors are toasted by the API layer; the card stays so they can try again
  const answer = (value: ConfirmationAnswer) =>
    confirmStep.mutate(
      { id: status.id, answer: value },
      {
        onSuccess: () => {
          setRejecting(false);
          toast.success(value === "APPROVED" ? step.approved : step.rejected);
        },
      },
    );

  // Answered: hidden until the status moves on (it's loaded again straight away)
  if (confirmStep.isSuccess) return null;

  return (
    <section className="rounded-2xl border-2 border-gray-900 bg-white p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white">
            <Icon size={20} strokeWidth={1.8} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Action needed
            </p>
            <h2 className="mt-0.5 text-base font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{message}</p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setRejecting(true)}
            disabled={confirmStep.isPending}
            className="h-11 rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step.reject}
          </button>

          <button
            type="button"
            onClick={() => answer("APPROVED")}
            disabled={confirmStep.isPending}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {answering === "APPROVED" && <Spinner className="h-4 w-4" />}
            {answering === "APPROVED" ? "Confirming..." : step.approve}
          </button>
        </div>
      </div>

      {rejecting && (
        <ConfirmModal
          title={step.reject}
          confirmLabel={step.reject}
          cancelLabel="Go Back"
          pendingLabel="Sending..."
          pending={answering === "REJECTED"}
          tone="danger"
          onConfirm={() => answer("REJECTED")}
          onClose={() => setRejecting(false)}
        >
          {step.rejectQuestion}
        </ConfirmModal>
      )}
    </section>
  );
}
