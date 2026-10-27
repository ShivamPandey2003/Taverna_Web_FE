import { useRef, useState } from "react";
import { ArrowLeft, Calendar, X } from "reicon-react";
import { useNavigate } from "react-router";
// import { toast } from "sonner";
import type { Vehicle, VehicleServiceRecord } from "@/types/vehicle";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectVehicleById } from "@/redux/vehicle/vehicleSlice";
import { setSelectedService, setSelectedVehicle } from "@/redux/booking/bookingSlice";
import {
  closeVehicleDetails,
  selectDashboardModal,
} from "@/redux/modals/dashboardModal/dashboardModalSlice";
import { VehicleTitle } from "@/components/features/dashboard/VehicleTitle";
import { useVehicleOverview } from "@/services/queries/vehicleQueries";
import { cn, maskedVin } from "@/libs/utils";
import {
  statusIcons,
  trackingPath,
  useVehicleService,
} from "@/components/features/tracking/serviceStatus";

// The Vehicle Details view (photo, VIN / miles, last service, Book Pickup) is
// switched off for now: the card's history icon opens the Service History
// straight away. Set to true to bring the details back, with "View all" and the
// back arrow between the two.
const SHOW_DETAILS = false;

// Details of a vehicle already in the user's list. "View all" swaps the details
// for the vehicle's whole service history, in the same modal.
export function SavedVehicleDetailsModal() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { viewVehicleId } = useAppSelector(selectDashboardModal);
  const savedVehicle = useAppSelector((state) =>
    selectVehicleById(state, viewVehicleId)
  );
  const { data: overview, isLoading } = useVehicleOverview(savedVehicle?.id ?? null);
  // A vehicle with a running service can't be booked again until it's complete
  // (as on its card): the modal then offers that service's tracking instead
  const service = useVehicleService(savedVehicle?.vin);
  // The vehicle whose full history is showing; another vehicle opens on its details
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  // The details view's height, taken as "View all" is clicked: the history view
  // keeps it, so the modal doesn't jump, and only its list of services scrolls
  const modalRef = useRef<HTMLDivElement>(null);
  const [detailsHeight, setDetailsHeight] = useState<number | null>(null);

  if (!savedVehicle) {
    return null;
  }

  // The list's copy shows straight away; the overview replaces it once loaded.
  // The list's mileage stands in while the overview has none.
  const vehicle: Vehicle = overview
    ? { ...overview.vehicle, miles: overview.vehicle.miles ?? savedVehicle.miles }
    : savedVehicle;

  const history = overview?.serviceHistory ?? [];
  const showingHistory = !SHOW_DETAILS || historyFor === savedVehicle.id;

  const onClose = () => {
    setHistoryFor(null);
    dispatch(closeVehicleDetails());
  };

  const onTrackService = () => {
    if (!service) return;
    dispatch(closeVehicleDetails());
    navigate(trackingPath(service.booking.id));
  };

  const StatusIcon = service ? statusIcons[service.status] : null;
  const statusLabel = service?.display.etaMinutes
    ? `Arriving in ${service.display.etaMinutes} mins`
    : service?.display.label;

  // As the card's Book Pickup: skips the service list, straight to review with
  // Pickup & Delivery
  const onBookPickup = () => {
    dispatch(setSelectedVehicle(vehicle.id));
    dispatch(setSelectedService("pickup-delivery"));
    dispatch(closeVehicleDetails());
    navigate("/dashboard/book-service/review");
  };

  // const onRemoveVehicle = () => {
  //   dispatch(removeVehicle(vehicle.id));
  //   toast.success(`${vehicle.brand} ${vehicle.model} removed`);
  // };

  return (
    // Over the window, not inside the page: a tall modal never makes the page
    // behind it scroll
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        data-test-id="vehicle-details-backdrop"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal wrapper */}
      <div className="pointer-events-none relative flex h-full items-center justify-center p-4 sm:p-6">
        {/* Modal: at most the window's height; only on a very short screen does
            its own content scroll */}
        <div
          ref={modalRef}
          className={cn(
            "pointer-events-auto relative flex max-h-full w-full max-w-[520px] flex-col rounded-2xl bg-white p-6 shadow-2xl",
            showingHistory ? "overflow-hidden" : "overflow-y-auto",
          )}
          style={showingHistory && detailsHeight ? { height: detailsHeight } : undefined}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-2">
              {SHOW_DETAILS && showingHistory && (
                <button
                  data-test-id="vehicle-details-back-button"
                  type="button"
                  onClick={() => setHistoryFor(null)}
                  className="-ml-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Back to vehicle details"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <h2 className="text-xl font-bold tracking-tight text-[#111827]">
                {showingHistory ? "Service History" : "Vehicle Details"}
              </h2>
            </div>

            <button
              data-test-id="vehicle-details-close"
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          {showingHistory ? (
            <FullServiceHistory vehicle={vehicle} history={history} loading={isLoading} />
          ) : (
          // Its full height (it scrolls with the modal on a short screen)
          <div className="shrink-0">
          {/* Vehicle image, name, VIN and miles */}
          <VehicleHero vehicle={vehicle} />

          <div className="mt-4 h-px bg-gray-200" />

          {/* Service history */}
          <ServiceHistorySection
            history={history}
            loading={isLoading}
            onViewHistory={() => {
              setDetailsHeight(modalRef.current?.offsetHeight ?? null);
              setHistoryFor(savedVehicle.id);
            }}
          />

          {/* Divider */}
          <div className="my-4 h-px bg-gray-200" />

          {service ? (
            // Its running service, as the vehicle's card shows it: the status in
            // its colour, opening the tracking page
            <button
              data-test-id="vehicle-details-track-button"
              type="button"
              onClick={onTrackService}
              aria-label={`${statusLabel}: ${service.display.message}. Open tracking`}
              title={service.display.message}
              className={cn(
                "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition hover:brightness-95",
                service.display.color.soft,
              )}
            >
              {StatusIcon && <StatusIcon size={18} className="shrink-0" />}
              <span className="truncate">{statusLabel}</span>
            </button>
          ) : (
            <button
              data-test-id="vehicle-details-book-pickup"
              type="button"
              onClick={onBookPickup}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111827] text-sm font-semibold text-white transition hover:bg-black"
            >
              <Calendar size={16} />
              <p className="pt-1">Book Pickup</p>
            </button>
          )}
          </div>
          )}

          {/* Remove Vehicle */}
          {/* <button
            type="button"
            onClick={onRemoveVehicle}
            className="mt-4 block w-full text-center text-sm font-semibold text-gray-700 transition hover:text-red-600"
          >
            Remove Vehicle
          </button> */}
        </div>
      </div>
    </div>
  );
}

// "View all": the vehicle on one compact line (photo | name and VIN), then every
// past service, newest first as the API sends them
function FullServiceHistory({
  vehicle,
  history,
  loading,
}: {
  vehicle: Vehicle;
  history: VehicleServiceRecord[];
  loading: boolean;
}) {
  return (
    // Fills the modal: the vehicle and the count stay put, the list scrolls
    <div className="mt-4 flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-4">
        <img
          src={vehicle.image}
          alt=""
          className="h-14 w-20 shrink-0 rounded-lg bg-gray-50 object-contain"
        />

        <div className="min-w-0">
          <h3 className="text-base font-bold text-gray-900">
            <VehicleTitle vehicle={vehicle} singleLine />
          </h3>
          <p className="mt-0.5 text-xs text-gray-500" title={vehicle.vin}>
            VIN: <span className="font-semibold text-gray-700">{maskedVin(vehicle.vin)}</span>
          </p>
        </div>
      </div>

      <div className="my-4 h-px shrink-0 bg-gray-200" />

      {history.length === 0 ? (
        // It can open before the history has loaded, and a vehicle may have none
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">
            {loading ? "Loading service history..." : "No service history available."}
          </p>
        </div>
      ) : (
        <>
          <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {history.length} {history.length === 1 ? "service" : "services"}
          </p>

          {/* The right padding keeps the cards clear of the scrollbar */}
          <div className="-mr-2 mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
            {history.map((record) => (
              <ServiceHistoryCard key={record.id} service={record} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface VehicleHeroProps {
  vehicle: Vehicle;
}

// Laid out like the dashboard's VehicleCard (and the Add Vehicle modal): the
// photo on its own, then the name (year, make, model), then the VIN and miles
function VehicleHero({ vehicle }: VehicleHeroProps) {
  return (
    <div className="mt-4">
      <div className="flex h-[150px] items-center justify-center overflow-hidden">
        <img
          src={vehicle.image}
          alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="pt-5">
        <h3 className="text-xl font-bold leading-tight text-gray-900">
          <VehicleTitle vehicle={vehicle} singleLine />
        </h3>

        <div className="my-4 h-px bg-gray-200" />

        {/* As on the card: last 6 of the VIN (full VIN in the tooltip), miles beside it */}
        <div className="flex gap-12">
          <VehicleStat
            label="VIN"
            value={maskedVin(vehicle.vin)}
            title={vehicle.vin}
          />

          <VehicleStat label="Miles" value={vehicle.miles || "—"} />
        </div>
      </div>
    </div>
  );
}

function VehicleStat({
  label,
  value,
  title,
}: {
  label: string;
  value: string | number;
  title?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-800">{label}</p>

      <p
        title={title}
        className="mt-1 whitespace-nowrap text-sm font-semibold tracking-wide text-gray-900"
      >
        {value}
      </p>
    </div>
  );
}

interface ServiceHistorySectionProps {
  history: VehicleServiceRecord[];
  loading: boolean;
  onViewHistory?: () => void;
}

function ServiceHistorySection({
  history,
  loading,
  onViewHistory,
}: ServiceHistorySectionProps) {
  return (
    <section className="mt-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">
          Service History
        </h3>

        {/* Disabled until there's a service history to open */}
        <button
          data-test-id="vehicle-details-view-history"
          type="button"
          onClick={onViewHistory}
          disabled={!onViewHistory || history.length === 0}
          className="text-xs font-medium text-gray-500 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:text-gray-300"
        >
          View all &gt;
        </button>
      </div>

      {/* History */}
      <div className="mt-3 space-y-3">
        {history.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              {loading
                ? "Loading service history..."
                : "No service history available."}
            </p>
          </div>
        ) : (
          history.slice(0, 1).map((service) => (
            <ServiceHistoryCard
              key={service.id}
              service={service}
            />
          ))
        )}
      </div>
    </section>
  );
}

interface ServiceHistoryCardProps {
  service: VehicleServiceRecord;
}

function ServiceHistoryCard({
  service,
}: ServiceHistoryCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {service.date}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {service.dealership}
          </p>
        </div>

        <span
          className={[
            "rounded-full px-3 py-1",
            "text-[10px] font-bold",
            service.status === "COMPLETED"
              ? "bg-black text-white"
              : "bg-red-100 text-red-600",
          ].join(" ")}
        >
          {service.status}
        </span>
      </div>

      {/* Divider */}
      <div className="my-3 h-px bg-gray-200" />

      {/* Bottom row: what was done (and which booking), and what it cost */}
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-xs text-gray-500" title={service.description}>
          <span className="font-medium text-gray-700">{service.description}</span>
          {service.bookingId && <> · {service.bookingId}</>}
        </p>

        <p className="shrink-0 text-sm font-bold text-gray-900">
          {service.amount}
        </p>
      </div>
    </article>
  );
}