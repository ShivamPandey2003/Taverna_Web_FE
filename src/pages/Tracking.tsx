import { useNavigate, useParams } from "react-router";
import { StaffContactCard } from "@/components/features/tracking/StaffContactCard";
import { TrackingMap } from "@/components/features/tracking/TrackingMap";
import { TrackingHeader } from "@/components/features/tracking/TrackingHeader";
import { BookingActions } from "@/components/features/tracking/BookingActions";
import { BookingDetailsCard } from "@/components/features/tracking/BookingDetailsCard";
import {
  getStatusDisplay,
  getTrackingStage,
  pickTrackedService,
  useActiveServices,
} from "@/components/features/tracking/serviceStatus";
import { formatPickupTime } from "@/libs/utils";
import { useServiceStatus } from "@/services/queries/bookingQueries";
import { BookingStatus as Status } from "@/types/booking";

export function ServiceTracking() {
  const navigate = useNavigate();
  // The booking in the URL; without one, the newest that's still running
  const { bookingId } = useParams();
  const booking = pickTrackedService(useActiveServices(), bookingId)?.booking ?? null;
  // Where it stands, from the API and kept fresh while the page is open; the
  // Redux snapshot covers the first render and API failures
  const { data: live } = useServiceStatus(booking?.id ?? null);

  if (!booking) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[#f8f9fa] px-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          No Active Booking
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

  const subtitle = booking.scheduledAt
    ? `Pickup scheduled for ${formatPickupTime(booking.scheduledAt)}`
    : `Booked ${formatPickupTime(booking.createdAt)}`;

  const status = live?.status ?? booking.status;
  const display = getStatusDisplay(status, live);
  const stage = getTrackingStage(status);

  return (
    <div className="min-h-0 h-full bg-[#f8f9fa] px-6 py-4 lg:px-10 overflow-auto">
      <div className="mx-auto max-w-[1200px] space-y-6">
        {/* Vehicle and live status together */}
        <TrackingHeader
          vehicle={booking.vehicle}
          dealership={booking.dealership.name}
          title={display.message}
          subtitle={subtitle}
          status={status}
          statusLabel={live?.label ?? status}
          gradient={display.color.gradient}
        />

        {/* Before anyone is assigned: what was booked */}
        {stage === "details" && (
          <>
            <BookingDetailsCard booking={booking} />
            <BookingActions booking={booking} canCancel={status === Status.IN_QUEUE} />
          </>
        )}

        {/* The customer's contact while the vehicle is at the dealership */}
        {stage === "advisor" && live?.advisor && (
          <StaffContactCard member={live.advisor} role="Advisor" />
        )}

        {/* Only while a valet is moving the vehicle */}
        {stage === "valet" && <TrackingMap />}
      </div>
    </div>
  );
}
