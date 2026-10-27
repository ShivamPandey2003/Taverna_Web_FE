import { Calendar, History } from "reicon-react";
import { brandName, cn, maskedVin } from "@/libs/utils";
import { statusIcons, type ActiveService } from "@/components/features/tracking/serviceStatus";
import type { Vehicle } from "@/types/vehicle";
import { VehicleTitle } from "./VehicleTitle";

interface VehicleCardProps {
  vehicle: Vehicle;
  // Opens the vehicle details; the info icon next to the name
  onSelect?: () => void;
  // Starts a pickup booking for this vehicle; button next to the stats
  onBook?: () => void;
  // The vehicle's running service, if it has one: its status replaces the booking
  // button (a vehicle can't be booked again until the service is complete)
  service?: ActiveService | null;
  // Opens that service's tracking page; the status button
  onTrack?: () => void;
}

export function VehicleCard({
  vehicle,
  onSelect,
  onBook,
  service,
  onTrack,
}: VehicleCardProps) {
  const StatusIcon = service ? statusIcons[service.status] : null;
  const statusLabel = service?.display.etaMinutes
    ? `Arriving in ${service.display.etaMinutes} mins`
    : service?.display.label;

  return (
    <article className="@container group w-full max-w-[380px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Image */}
      <div className="relative flex h-[180px] items-center justify-center overflow-hidden">
        {" "}
        {/* bg-[#f4f4f7] */}
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Information */}
      <div className="p-5">
        {/* Year and brand on the first line, model on the second, all one style;
            the history icon (details and service history) sits on the right edge */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-xl font-bold leading-tight text-gray-900">
            <VehicleTitle vehicle={vehicle} />
          </h2>

          {onSelect && (
            <button
              data-test-id={`vehicle-card-details-${vehicle.id}`}
              type="button"
              onClick={onSelect}
              aria-label={`Details for ${brandName(vehicle.brand)} ${vehicle.model}`}
              title="Vehicle details and service history"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <History size={18} />
            </button>
          )}
        </div>

        <div className="my-5 h-px bg-gray-200" />

        {/* Stats, with the booking button beside them. The stats keep their
            width; a long status is cut short in the button instead. On a narrow
            card (a phone) there's no room for both, so the button goes under the
            stats at full width */}
        <div className="flex flex-col gap-4 @[340px]:flex-row @[340px]:items-end @[340px]:justify-between @[340px]:gap-3">
          <div className="flex shrink-0 gap-4">
            {/* Last 4 of the VIN, like everywhere else; the full VIN is in the tooltip */}
            <VehicleStat
              label="VIN"
              value={maskedVin(vehicle.vin)}
              title={vehicle.vin}
            />

            <VehicleStat label="Miles" value={vehicle.miles || "—"} />
          </div>

          {service ? (
            <button
              data-test-id={`vehicle-card-track-${vehicle.id}`}
              type="button"
              onClick={onTrack}
              aria-label={`${brandName(vehicle.brand)} ${vehicle.model}, ${statusLabel}: ${service.display.message}. Open tracking`}
              title={service.display.message}
              className={cn(
                "flex h-10 min-w-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition hover:brightness-95",
                service.display.color.soft,
              )}
            >
              {StatusIcon && <StatusIcon size={16} className="shrink-0" />}
              <span className="truncate">{statusLabel}</span>
            </button>
          ) : onBook && (
            <button
              data-test-id={`vehicle-card-book-${vehicle.id}`}
              type="button"
              onClick={(event) => {
                // Don't also open the vehicle details
                event.stopPropagation();
                onBook();
              }}
              aria-label={`Book a pickup for ${brandName(vehicle.brand)} ${vehicle.model}`}
              className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-black px-4 text-sm leading-none font-semibold text-white transition hover:bg-gray-800"
            >
              {/* The calendar is drawn low in its box; lift it to the text's centre */}
              <Calendar
                size={16}
                className="shrink-0"
              />
              <span className="text-[16px]">Book Pickup</span>
            </button>
          )}
        </div>
      </div>
    </article>
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
      <p className="text-xs text-gray-800 font-medium">{label}</p>

      <p
        title={title}
        className="mt-1 whitespace-nowrap text-sm font-semibold text-gray-900"
      >
        {value}
      </p>
    </div>
  );
}
