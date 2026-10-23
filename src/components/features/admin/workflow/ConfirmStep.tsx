import { toast } from "sonner";
import type { AdminBooking } from "@/types/admin";
import { useConfirmBooking } from "@/services/queries/adminQueries";
import { formatDateTime, isCancelled, isComplete, isConfirmed } from "../admin.utils";
import { BookingOverview } from "../details/BookingOverview";
import { ActionButton, StepDone } from "./StepParts";

interface ConfirmStepProps {
  booking: AdminBooking;
  onDone: () => void;
}

// Shows what the customer booked so the admin can check it before accepting
export function ConfirmStep({ booking, onDone }: ConfirmStepProps) {
  const confirmBooking = useConfirmBooking();

  const handleConfirm = () => {
    confirmBooking.mutate(booking.id, {
      onSuccess: () => {
        toast.success(`Booking ${booking.id} confirmed`);
        onDone();
      },
    });
  };

  return (
    <div className="space-y-4">
      <BookingOverview booking={booking} />

      {isCancelled(booking) ? (
        <p className="rounded-xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-600">
          This booking was cancelled, so it can't be confirmed.
        </p>
      ) : isConfirmed(booking) ? (
        <StepDone
          // Without confirmedAt the booking moved on by itself (e.g. a tow truck
          // booked by the customer), so there's no time to show
          text={
            booking.confirmedAt ? `Confirmed on ${formatDateTime(booking.confirmedAt)}` : "Confirmed"
          }
          actionLabel={isComplete(booking) ? undefined : "Next: Vehicle Intake"}
          onAction={onDone}
        />
      ) : (
        <>
          {/* <p className="text-sm text-gray-500">
            Confirming lets the customer know their booking was accepted.
          </p> */}
          <ActionButton
            pending={confirmBooking.isPending}
            pendingLabel="Confirming..."
            onClick={handleConfirm}
          >
            Confirm Booking
          </ActionButton>
        </>
      )}
    </div>
  );
}
