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
  useMyBookings,
  useServiceStatus,
} from "@/services/queries/bookingQueries";
import { useVehicles } from "@/services/queries/vehicleQueries";
import {
  BookingStatus as Status,
  type Booking,
  type CustomerBookingDetails,
} from "@/types/booking";
import type { Vehicle } from "@/types/vehicle";

// The statuses the bill shows at
const BILL_STATUSES: (string | undefined)[] = ["INVOICE_GENERATED", "PAYMENT_VERIFICATION_PENDING"];

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
  const statusCode = live?.code ?? details?.code;
  const { data: staff } = useBookingStaff(booking?.id ?? null, live?.code);

  // After a reload the booking isn't known yet: it's put back from the bookings
  // list once that and the vehicles have loaded (useSyncActiveBookings). Until
  // then this is loading, not "no booking". Same queries as the layout's, so
  // nothing extra is fetched.
  const { data: list, isPending: listLoading } = useMyBookings();
  const { data: vehicles, isPending: vehiclesLoading } = useVehicles();
  const awaitingRestore =
    !!vehicles?.length &&
    !!list?.some((item) => item.open && (!bookingId || item.id === bookingId));
  const restoring = listLoading || vehiclesLoading || awaitingRestore;

  if (!booking && restoring) {
    return <TrackingSkeleton />;
  }

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

  // What the page shows under the header, besides the booking details. The
  // staff card counts once the status has someone, before their details arrive,
  // so the booking details don't flash up meanwhile.
  const showStaff = !!staffNeed;
  const showBill = !!details?.invoice && BILL_STATUSES.includes(statusCode);
  const showMap = stage === "valet" || staffNeed?.type === "valet";
  // The booking details: before anyone is assigned, and at any status between
  // hand-offs that has nothing else to show (e.g. the vehicle has arrived at the
  // dealership and no advisor has it yet), so the page is never just the header
  const showDetails = stage === "details" || (!showStaff && !showBill && !showMap);

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

        {/* What was booked (see showDetails) */}
        {showDetails && (
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
        {showStaff && staffNeed && staff && (
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

        {/* The bill, until the dealership confirms the payment: Pay Now while
            INVOICE_GENERATED, then paid and waiting while PAYMENT_VERIFICATION_PENDING */}
        {showBill && details?.invoice && (
          <InvoiceCard
            bookingId={booking.id}
            invoice={{
              ...details.invoice,
              paid: details.invoice.paid || statusCode === "PAYMENT_VERIFICATION_PENDING",
            }}
          />
        )}

        {/* While a valet has the trip, either way (the delivery valet's statuses
            count as the vehicle's return, not the valet stage) */}
        {showMap && (
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

// The page's shape while the booking is loaded: the header panel and two cards
function TrackingSkeleton() {
  return (
    <div className="min-h-0 h-full bg-[#f8f9fa] px-6 py-4 lg:px-10 overflow-auto">
      <div
        className="mx-auto max-w-[1200px] animate-pulse space-y-6"
        role="status"
        aria-label="Loading your booking"
      >
        <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-6">
            <div className="h-24 w-36 shrink-0 rounded-xl bg-gray-100" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 rounded bg-gray-100" />
              <div className="h-4 w-32 rounded bg-gray-100" />
            </div>
          </div>
          <div className="h-40 rounded-2xl bg-gray-100 md:w-[45%]" />
        </div>

        <div className="h-28 rounded-2xl border border-gray-200 bg-white" />
        <div className="h-64 rounded-2xl border border-gray-200 bg-white" />
      </div>
    </div>
  );
}
