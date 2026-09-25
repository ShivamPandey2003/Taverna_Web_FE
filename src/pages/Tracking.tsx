import { useNavigate } from "react-router";
import { BookingStatus } from "@/components/features/tracking/BookingStatus";
import { InvoiceCard } from "@/components/features/tracking/InvoiceCard";
import { StaffContactCard } from "@/components/features/tracking/StaffContactCard";
import { TrackingMap } from "@/components/features/tracking/TrackingMap";
import { VehicleSummary } from "@/components/features/tracking/VehicleSummary";
import {
  getStatusDisplay,
  getTrackingStage,
} from "@/components/features/tracking/serviceStatus";
import { useAppSelector } from "@/redux/hooks";
import { selectActiveBooking } from "@/redux/tracking/trackingSlice";
import { USE_MOCK_API } from "@/services/apiClient";
import { useMyBooking, useSimulateNextStatus } from "@/services/queries/bookingQueries";
import { BookingStatus as Status } from "@/types/booking";

export function ServiceTracking() {
  const navigate = useNavigate();
  const booking = useAppSelector(selectActiveBooking);
  // Live copy from the API; the Redux snapshot covers the first render and API failures
  const { data: liveBooking } = useMyBooking(booking?.id ?? null);
  const simulateNextStatus = useSimulateNextStatus();

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

  const status = liveBooking?.status ?? booking.status;
  const display = getStatusDisplay(status, liveBooking?.etaMinutes);
  // Which cards to show; nothing extra until the live booking has loaded
  const stage = liveBooking ? getTrackingStage(liveBooking, status) : "waiting";
  // The demo control is only offered while the mock API answers, and not once finished
  const canSimulate = USE_MOCK_API && status !== Status.SERVICE_COMPLETE;

  return (
    <div className="min-h-0 h-full bg-[#f8f9fa] px-6 py-4 lg:px-10 overflow-auto">
      <div className="mx-auto max-w-[1200px] space-y-6">
        <BookingStatus
          dealership={booking.dealership.name.toUpperCase()}
          time={time}
          status={status}
          tone={display.tone}
          onAdvance={canSimulate ? () => simulateNextStatus.mutate(booking.id) : undefined}
          advancing={simulateNextStatus.isPending}
        />

        {/* One contact at a time: the valet until a relationship manager takes over */}
        {stage === "valet" && liveBooking?.valet && (
          <StaffContactCard member={liveBooking.valet} role="Valet" />
        )}
        {(stage === "manager" || stage === "payment") && liveBooking?.relationshipManager && (
          <StaffContactCard member={liveBooking.relationshipManager} role="Relation Manager" />
        )}

        {/* The bill, from the moment the admin records payment; a receipt once complete */}
        {(stage === "payment" || stage === "complete") && liveBooking?.invoice && (
          <InvoiceCard
            bookingId={liveBooking.id}
            invoice={liveBooking.invoice}
            payment={liveBooking.payment}
          />
        )}

        <VehicleSummary vehicle={booking.vehicle} />

        {/* Only while someone is moving the vehicle */}
        {(stage === "valet" || stage === "manager") && <TrackingMap />}
      </div>
    </div>
  );
}
