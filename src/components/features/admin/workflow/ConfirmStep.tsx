import { CheckCircle } from "reicon-react";
import { toast } from "sonner";
import type { AdminBooking } from "@/types/admin";
import { useConfirmBooking } from "@/services/queries/adminQueries";
import { formatDateTime } from "../admin.utils";

interface ConfirmStepProps {
  booking: AdminBooking;
  onDone: () => void;
}

export function ConfirmStep({ booking, onDone }: ConfirmStepProps) {
  const confirmBooking = useConfirmBooking();

  if (booking.confirmedAt) {
    return (
      <StepDone
        text={`Confirmed on ${formatDateTime(booking.confirmedAt)}`}
        actionLabel="Next: assign valet"
        onAction={onDone}
      />
    );
  }

  const handleConfirm = () => {
    confirmBooking.mutate(booking.id, {
      onSuccess: () => {
        toast.success(`Booking ${booking.id} confirmed`);
        onDone();
      },
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-bold text-gray-900">Confirm this booking</h3>
      <p className="mt-1 text-sm text-gray-500">
        Check the details above. Confirming lets the customer know their booking was accepted.
      </p>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={confirmBooking.isPending}
        className="mt-5 h-11 w-full rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {confirmBooking.isPending ? "Confirming..." : "Confirm Booking"}
      </button>
    </div>
  );
}

export function StepDone({
  text,
  actionLabel,
  onAction,
}: {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
        <CheckCircle size={18} className="shrink-0 text-emerald-600" />
        {text}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
