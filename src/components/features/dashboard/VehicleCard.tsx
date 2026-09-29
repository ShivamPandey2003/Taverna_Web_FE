import { Calendar } from "reicon-react";
import { brandName, maskedVin } from "@/libs/utils";
import type { Vehicle } from "@/types/vehicle";

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect?: () => void;
  // Starts a booking for this vehicle; offered on hover
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

        {/* Round icon in the corner that grows into a labelled pill when the card is
            hovered or the button focused, and turns black when it's hovered itself.
            Touch screens can't hover, so they always get the full pill. */}
        {onBook && (
          <button
            type="button"
            onClick={(event) => {
              // Don't also open the vehicle details
              event.stopPropagation();
              onBook();
            }}
            aria-label={`Book a service for ${brandName(vehicle.brand)} ${vehicle.model}`}
            className="absolute right-3 top-3 flex h-9 items-center rounded-full border border-gray-200 bg-white px-2.5 text-gray-900 shadow-sm transition-all duration-300 hover:border-black hover:bg-black hover:text-white focus-visible:border-black group-hover:shadow-md"
          >
            <Calendar size={16} className="shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-32 group-hover:opacity-100 group-focus-within:ml-2 group-focus-within:max-w-32 group-focus-within:opacity-100 [@media(hover:none)]:ml-2 [@media(hover:none)]:max-w-32 [@media(hover:none)]:opacity-100">
              Book service
            </span>
          </button>
        )}
      </div>

      {/* Information */}
      <div className="p-5">

        {/* Brand and model share one style, on two lines */}
        <h2 className="text-xl font-bold leading-tight text-gray-900">
          {brandName(vehicle.brand)}
          <span className="block">{vehicle.model}</span>
        </h2>

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
