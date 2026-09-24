import { useNavigate } from "react-router";
import { BookingStatus } from "@/components/features/tracking/BookingStatus";
import { TrackingMap } from "@/components/features/tracking/TrackingMap";
import { VehicleSummary } from "@/components/features/tracking/VehicleSummary";
import { useAppSelector } from "@/redux/hooks";
import { selectActiveBooking } from "@/redux/tracking/trackingSlice";
import { useMyBooking } from "@/services/queries/bookingQueries";

export function ServiceTracking() {
  const navigate = useNavigate();
  const booking = useAppSelector(selectActiveBooking);
  // Live copy from the API; the Redux snapshot covers the first render and API failures
  const { data: liveBooking } = useMyBooking(booking?.id ?? null);

  if (!booking) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[#f8f9fa] px-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          No active booking
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Book a service to track it here.
        </p>

        <button
          type="button"
          onClick={() => navigate("/dashboard/book-service")}
          className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Book Service
        </button>
      </div>
    );
  }

  const time = new Date(booking.scheduledAt ?? booking.createdAt).toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit" }
  );

  return (
    <div className="min-h-0 h-full bg-[#f8f9fa] px-6 py-4 lg:px-10 overflow-auto">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <BookingStatus
          dealership={booking.dealership.name.toUpperCase()}
          time={time}
          status={liveBooking?.status ?? booking.status}
          valetName={liveBooking?.valet?.name}
        />

        <VehicleSummary vehicle={booking.vehicle} />

        <TrackingMap />
      </div>
    </div>
  );
}
