import type { Vehicle } from "@/types/vehicle";

interface VehicleSummaryProps {
  vehicle: Vehicle;
}

export function VehicleSummary({
  vehicle,
}: VehicleSummaryProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-3">
      <div className="flex min-h-[155px] items-center gap-6">
        {/* Vehicle image */}
        <div className="flex h-[145px] w-[240px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f6f7f8]">
          <img
            src={vehicle.image}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Divider */}
        <div className="hidden h-[120px] w-px bg-gray-200 md:block" />

        {/* Vehicle details */}
        <div className="flex-1">
          <h2 className="text-xl font-bold tracking-tight text-[#111827] md:text-2xl">
            {vehicle.brand} {vehicle.model}
          </h2>

          <div className="mt-5 grid grid-cols-3 gap-6">
            <VehicleInfo
              label="VIN"
              value={vehicle.vin}
            />

            <VehicleInfo
              label="YEAR"
              value={vehicle.year}
            />

            <VehicleInfo
              label="MILES"
              value={vehicle.miles}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface VehicleInfoProps {
  label: string;
  value: string | number;
}

function VehicleInfo({
  label,
  value,
}: VehicleInfoProps) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-gray-900 md:text-base">
        {value}
      </p>
    </div>
  );
}