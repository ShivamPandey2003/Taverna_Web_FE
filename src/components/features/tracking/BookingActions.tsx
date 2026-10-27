import { useState } from "react";
import { Share } from "reicon-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { selectAccountUser } from "@/redux/account/accountSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearActiveBooking } from "@/redux/tracking/trackingSlice";
import { useCancelBooking } from "@/services/queries/bookingQueries";
import type { Booking, CustomerBookingDetails } from "@/types/booking";
import { shareBooking } from "./bookingDetails";

interface BookingActionsProps {
  booking: Booking;
  // The API's details, once loaded, for what Share sends
  details?: CustomerBookingDetails | null;
  // Only until the dealership confirms the booking (In-queue)
  canCancel: boolean;
}

// What the customer can do while waiting: share the booking, cancel it, or head back home
export function BookingActions({ booking, details, canCancel }: BookingActionsProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAccountUser);
  const navigate = useNavigate();
  const cancelBooking = useCancelBooking();
  const [confirming, setConfirming] = useState(false);

  const handleCancel = () =>
    cancelBooking.mutate(booking.id, {
      onSuccess: () => {
        dispatch(clearActiveBooking(booking.id));
        toast.success("Booking cancelled");
        navigate("/dashboard");
      },
    });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500 ml-5">
        {canCancel
          ? "Cancel your booking anytime before dealership confirmation."
          : "We'll update this page as your service moves along."}
      </p>

      <div className="flex shrink-0 flex-col-reverse gap-3 sm:flex-row">
        <button
          data-test-id="tracking-share-button"
          type="button"
          onClick={() => shareBooking(booking, user, details)}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
        >
          <Share size={16} />
          Share
        </button>

        {canCancel && (
          <button
            data-test-id="tracking-cancel-booking"
            type="button"
            onClick={() => setConfirming(true)}
            className="h-11 rounded-lg border border-gray-200 bg-white px-5 text-sm font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
          >
            Cancel Booking
          </button>
        )}

        <button
          data-test-id="tracking-go-home"
          type="button"
          onClick={() => navigate("/dashboard")}
          className="h-11 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Go to Home
        </button>
      </div>

      {confirming && (
        <ConfirmModal
          testId="cancel-booking-modal"
          title="Cancel Booking?"
          confirmLabel="Cancel Booking"
          cancelLabel="Keep Booking"
          pendingLabel="Cancelling..."
          pending={cancelBooking.isPending}
          onConfirm={handleCancel}
          onClose={() => setConfirming(false)}
        >
          Booking #{booking.id} will be cancelled and the dealership won't pick up your vehicle.
          You can book again any time.
        </ConfirmModal>
      )}
    </div>
  );
}
