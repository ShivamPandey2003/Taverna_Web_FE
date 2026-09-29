import { toast } from "sonner";
import type { AdminBooking } from "@/types/admin";
import { useConfirmBooking } from "@/services/queries/adminQueries";
import { formatDateTime } from "../admin.utils";
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

      {booking.confirmedAt ? (
        <StepDone
          text={`Confirmed on ${formatDateTime(booking.confirmedAt)}`}
          actionLabel="Next: Assign pickup valet"
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
