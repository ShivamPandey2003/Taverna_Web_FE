import { Car, Driving, Setting2, TickCircle } from "reicon-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";
import { useConfirmStep } from "@/services/queries/bookingQueries";
import type { ServiceStatus } from "@/types/booking";

interface StepCopy {
  icon: typeof Car;
  title: string;
  message: string;
  approve: string;
  approved: string;
}

// What the customer is asked at each step that waits for them
const copy: Record<string, StepCopy> = {
  VEHICLE_HANDED_OVER_TO_VALET: {
    icon: Car,
    title: "Did you hand your vehicle to the valet?",
    message: "Your valet says they have your vehicle. Confirm it so they can head to the dealership.",
    approve: "Yes, Confirm Pickup",
    approved: "Pickup confirmed. Your vehicle is on its way to the dealership.",
  },
  INSPECTION_COMPLETED: {
    icon: Setting2,
    title: "Your inspection is done: approval needed",
    message:
      "Your advisor has inspected your vehicle and needs your go-ahead before starting the work. Call them if you have questions.",
    approve: "Approve Work",
    approved: "Approved. Your vehicle's service will start shortly.",
  },
  VEHICLE_DELIVERED: {
    icon: Driving,
    title: "Did you get your vehicle back?",
    message: "Your valet says your vehicle has been delivered. Confirm you've received it to complete your service.",
    approve: "Yes, I Received",
    approved: "Thanks! Your service is complete.",
  },
};

// The step a status code asks about. Exact codes first; then by the words in
// the code, since the API renames its statuses (e.g. a "…_PENDING" or
// "…_CONFIRMATION" form of the same step). Delivery is checked before pickup:
// the delivery valet's codes also say VALET.
const STEP_WORDS: [RegExp, keyof typeof copy][] = [
  [/INSPECT|ESTIMATE|APPROV|QUOTE|WORK/, "INSPECTION_COMPLETED"],
  [/DELIVER|RETURN|RECEIPT|RECEIVED|DROP/, "VEHICLE_DELIVERED"],
  [/HAND|PICKUP|PICKED|COLLECT|VALET/, "VEHICLE_HANDED_OVER_TO_VALET"],
];

function stepCopy(code: string): StepCopy {
  if (copy[code]) return copy[code];
  const upper = code.toUpperCase();
  const match = STEP_WORDS.find(([words]) => words.test(upper));
  return match ? copy[match[1]] : fallback;
}

// Any other step the API asks about
const fallback: StepCopy = {
  icon: TickCircle,
  title: "Your confirmation is needed",
  message: "Please confirm this step of your service.",
  approve: "Confirm",
  approved: "Thanks for confirming.",
};

// Asks the customer to confirm the step their booking is waiting on (approve
// only: there is no reject button). Shown while the status says so
// (status.needsConfirmation); the API's own text replaces ours when it sends
// some. Give it `key={status.code}` so an answer isn't carried over to the next step.
export function ConfirmationCard({ status }: { status: ServiceStatus }) {
  const confirmStep = useConfirmStep();
  const step = stepCopy(status.code);
  const Icon = step.icon;
  const title = status.confirmationPrompt?.title ?? step.title;
  const message = status.confirmationPrompt?.message ?? step.message;

  // Errors are toasted by the API layer; the card stays so they can try again
  const approve = () =>
    confirmStep.mutate(
      { id: status.id, answer: "APPROVED" },
      { onSuccess: () => toast.success(step.approved) },
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

        <button
          data-test-id="tracking-confirm-step-button"
          type="button"
          onClick={approve}
          disabled={confirmStep.isPending}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {confirmStep.isPending && <Spinner className="h-4 w-4" />}
          {confirmStep.isPending ? "Confirming..." : step.approve}
        </button>
      </div>
    </section>
  );
}
