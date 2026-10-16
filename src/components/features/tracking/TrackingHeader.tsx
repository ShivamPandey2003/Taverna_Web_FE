import { VehicleTitle } from "@/components/features/dashboard/VehicleTitle";
import { cn, maskedVin } from "@/libs/utils";
import type { BookingStatus } from "@/types/booking";
import type { Vehicle } from "@/types/vehicle";
import { statusIcons } from "./serviceStatus";

interface TrackingHeaderProps {
  vehicle: Vehicle;
  dealership: string;
  // Headline for the current status, e.g. "Your valet is on the way"
  title: string;
  // When the booking was placed, or its scheduled pickup
  subtitle: string;
  // The stage the booking is at, for the icon, and the status's own name
  status: BookingStatus;
  statusLabel: string;
  // Gradient stops for the status's colour (StatusColor.gradient)
  gradient: string;
}

// The vehicle on the left over white, the booking status on the right in a rounded
// panel of its colour. They stack below md, vehicle on top.
export function TrackingHeader({
  vehicle,
  dealership,
  title,
  subtitle,
  status,
  statusLabel,
  gradient,
}: TrackingHeaderProps) {
  const Icon = statusIcons[status];
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="flex flex-col md:flex-row md:items-stretch">
        {/* Vehicle */}
        <div className="flex items-center gap-5 p-4 md:w-[58%] md:p-5">
          <div className="flex h-[100px] w-[150px] shrink-0 items-center justify-center overflow-hidden rounded-xl md:h-[130px] md:w-[200px]"> {/* bg-[#f6f7f8] */}
            <img
              src={vehicle.image}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              <VehicleTitle vehicle={vehicle} singleLine />
            </h2>

            <div className="mt-3 flex gap-6">
              <VehicleInfo label="VIN" value={maskedVin(vehicle.vin)} title={vehicle.vin} />
              <VehicleInfo label="MILES" value={vehicle.miles || "—"} />
            </div>
          </div>
        </div>

        {/* Status, in its own colour panel inside the card */}
        <div
          className={cn(
            "m-3 flex flex-1 flex-col items-center justify-center rounded-xl bg-linear-to-br px-6 py-7 text-center text-white",
            gradient,
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-white/85">
            {dealership}
          </p>

          <h1 className="mt-1.5 text-xl font-bold tracking-tight md:text-2xl">
            {title}
          </h1>

          <p className="mt-1 text-sm text-white/85">
            {subtitle}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-semibold backdrop-blur-sm">
            <Icon size={16} strokeWidth={2} className="shrink-0" />
            {statusLabel}
          </div>
        </div>
      </div>
    </section>
  );
}

function VehicleInfo({
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
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900 md:text-base" title={title}>
        {value}
      </p>
    </div>
  );
}
