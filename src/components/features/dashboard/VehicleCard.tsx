import { Calendar } from "reicon-react";
import { brandName, maskedVin } from "@/libs/utils";
import type { Vehicle } from "@/types/vehicle";

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect?: () => void;
  // Starts a booking for this vehicle; button next to the title
  onBook?: () => void;
}

export function VehicleCard({
  vehicle,
  onSelect,
  onBook,
}: VehicleCardProps) {
  return (
    <article
      onClick={onSelect}
      className="group w-full max-w-[380px] cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >

      {/* Image */}
      <div className="relative flex h-[180px] items-center justify-center overflow-hidden bg-[#f4f4f7]">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Information */}
      <div className="p-5">

        <div className="flex items-start justify-between gap-3">

          {/* Brand and model share one style, on two lines */}
          <h2 className="min-w-0 text-xl font-bold leading-tight text-gray-900">
            {brandName(vehicle.brand)}
            <span className="block">{vehicle.model}</span>
          </h2>

          {onBook && (
            <button
              type="button"
              onClick={(event) => {
                // Don't also open the vehicle details
                event.stopPropagation();
                onBook();
              }}
              aria-label={`Book a service for ${brandName(vehicle.brand)} ${vehicle.model}`}
              className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-900 transition hover:border-black hover:bg-black hover:text-white focus-visible:border-black"
            >
              <Calendar size={16} className="shrink-0" />
              Book service
            </button>
          )}

        </div>

        <div className="my-5 h-px bg-gray-200" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">

          <VehicleStat
            label="Year"
            value={vehicle.year}
          />

          {/* Full VIN is too long for the card; it's shown in the details modal */}
          <VehicleStat
            label="VIN"
            value={maskedVin(vehicle.vin)}
            title={vehicle.vin}
          />

          <VehicleStat
            label="Miles"
            value={vehicle.miles}
          />

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
    <div className="min-w-0">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p
        title={title}
        className="mt-1 truncate text-sm font-semibold text-gray-900"
      >
        {value}
      </p>
    </div>
  );
}
