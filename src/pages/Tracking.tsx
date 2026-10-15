import { useNavigate, useParams } from "react-router";
import { TrackingMap } from "@/components/features/tracking/TrackingMap";
import { useTrackingPoints } from "@/components/features/tracking/useTrackingPoints";
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
import { ConfirmationCard } from "@/components/features/tracking/ConfirmationCard";
import { InvoiceCard } from "@/components/features/tracking/InvoiceCard";
import { StaffContactCard } from "@/components/features/tracking/StaffContactCard";
import { staffNeeded } from "@/services/bookingApi";
import {
  useBookingStaff,
  useCustomerBookingDetails,
  useServiceStatus,
} from "@/services/queries/bookingQueries";
import {
  BookingStatus as Status,
  type Booking,
  type CustomerBookingDetails,
} from "@/types/booking";
import type { Vehicle } from "@/types/vehicle";

export function ServiceTracking() {
  const navigate = useNavigate();
  // The booking in the URL; without one, the newest that's still running
  const { bookingId } = useParams();
  const booking = pickTrackedService(useActiveServices(), bookingId)?.booking ?? null;
  // Where it stands, from the API and kept fresh while the page is open; the
  // Redux snapshot covers the first render and API failures
  const { data: live } = useServiceStatus(booking?.id ?? null);
  // What was booked, loaded again when the status moves on
  const { data: details } = useCustomerBookingDetails(booking?.id ?? null, live?.code);
  // The valet or advisor, only at a status that has one to show
  const staffNeed = live ? staffNeeded(live.code) : null;
  const { data: staff } = useBookingStaff(booking?.id ?? null, live?.code);

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

  // The API's details replace the snapshot's once loaded; the photo is only the
  // saved vehicle's
  const vehicle: Vehicle = details
    ? {
        ...booking.vehicle,
        year: details.vehicleYear,
        brand: details.vehicleMake,
        model: details.vehicleModel,
        vin: details.vin,
        miles: details.miles,
      }
    : booking.vehicle;

  // When the booking reached its current status (the status summary's doneAt);
  // the pickup time until that has loaded
  const subtitle = live?.doneAt
    ? live.doneAt
    : details?.scheduled
      ? `Pickup scheduled for ${details.scheduled}`
      : booking.scheduledAt
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
          vehicle={vehicle}
          dealership={details?.dealershipName ?? booking.dealership.name}
          // The status summary's label ("Valet On Road"); our own line for the
          // stage until it has loaded
          title={live?.apiLabel ?? display.message}
          subtitle={subtitle}
          status={status}
          statusLabel={live?.label ?? status}
          gradient={display.color.gradient}
        />

        {/* The step waiting for the customer's approval, first thing under the header */}
        {live?.needsConfirmation && <ConfirmationCard key={live.code} status={live} />}

        {/* Before anyone is assigned: what was booked */}
        {stage === "details" && (
          <>
            <BookingDetailsCard booking={booking} details={details} />
            <BookingActions
              booking={booking}
              details={details}
              canCancel={status === Status.IN_QUEUE}
            />
          </>
        )}

        {/* The valet of the current leg, or the advisor, while either is handling it */}
        {staffNeed && staff && (
          <StaffContactCard
            member={staff}
            role={
              staffNeed.type === "advisor"
                ? "Advisor"
                : staffNeed.leg === "pickup"
                  ? "Pickup Valet"
                  : "Delivery Valet"
            }
          />
        )}

        {/* The bill, only until it's paid (the status moves past INVOICE_GENERATED) */}
        {details?.invoice && (live?.code ?? details.code) === "INVOICE_GENERATED" && (
          <InvoiceCard bookingId={booking.id} invoice={details.invoice} />
        )}

        {/* While a valet has the trip, either way (the delivery valet's statuses
            count as the vehicle's return, not the valet stage) */}
        {(stage === "valet" || staffNeed?.type === "valet") && (
          <TripMap booking={booking} details={details} />
        )}
      </div>
    </div>
  );
}

// The map's two ends: only looked up while the map is shown
function TripMap({
  booking,
  details,
}: {
  booking: Booking;
  details: CustomerBookingDetails | undefined;
}) {
  const { pickup, dealership, pickupMissing } = useTrackingPoints(booking, details);

  return (
    <TrackingMap
      pickup={pickup}
      dealership={dealership}
      dealershipName={details?.dealershipName ?? booking.dealership.name}
      pickupMissing={pickupMissing}
    />
  );
}
