import type { Vehicle } from "@/types/vehicle";

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect?: () => void;
}

export function VehicleCard({
  vehicle,
  onSelect,
}: VehicleCardProps) {
  return (
    <article
      onClick={onSelect}
      className="w-full max-w-[380px] cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >

      {/* Image */}
      <div className="flex h-[180px] items-center justify-center bg-[#f4f4f7]">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-contain"
        />
      </div>

      {/* Information */}
      <div className="p-5">

        <p className="text-xs font-medium text-gray-500">
          {vehicle.brand}
        </p>

        <h2 className="mt-1 text-xl font-bold text-gray-900">
          {vehicle.model}
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
            value={`***${vehicle.vin.slice(-4)}`}
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