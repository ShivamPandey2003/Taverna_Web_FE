import { Calendar, InfoCircle } from "reicon-react";
import { brandName, maskedVin } from "@/libs/utils";
import type { Vehicle } from "@/types/vehicle";
import { VehicleTitle } from "./VehicleTitle";

interface VehicleCardProps {
  vehicle: Vehicle;
  // Opens the vehicle details; the info icon next to the name
  onSelect?: () => void;
  // Starts a pickup booking for this vehicle; button next to the stats
  onBook?: () => void;
}

export function VehicleCard({
  vehicle,
  onSelect,
  onBook,
}: VehicleCardProps) {
  return (
    <article
      className="group w-full max-w-[380px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
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

        {/* Year and brand on the first line, model on the second, all one style;
            the info icon sits on the right edge */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-xl font-bold leading-tight text-gray-900">
            <VehicleTitle vehicle={vehicle} />
          </h2>

          {onSelect && (
            <button
              type="button"
              onClick={onSelect}
              aria-label={`Details for ${brandName(vehicle.brand)} ${vehicle.model}`}
              title="Vehicle details"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <InfoCircle size={18} />
            </button>
          )}
        </div>

        <div className="my-5 h-px bg-gray-200" />

        {/* Stats, with the booking button beside them */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 gap-6">
            {/* Last 4 of the VIN, like everywhere else; the full VIN is in the tooltip */}
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

          {onBook && (
            <button
              type="button"
              onClick={(event) => {
                // Don't also open the vehicle details
                event.stopPropagation();
                onBook();
              }}
              aria-label={`Book a pickup for ${brandName(vehicle.brand)} ${vehicle.model}`}
              className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <Calendar size={16} className="shrink-0" />
              Book Pickup
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
    <div className="min-w-0">
      <p className="text-xs text-gray-800 font-medium">
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
