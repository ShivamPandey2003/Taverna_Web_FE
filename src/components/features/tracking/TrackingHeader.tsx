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
  status: BookingStatus;
  // Gradient end stop for the status's colour (StatusColor.gradient)
  gradient: string;
  // Demo only (mock API): makes the status pill move the booking to its next status
  onAdvance?: () => void;
  advancing?: boolean;
}

// The vehicle on the left over white, the booking status on the right over its colour.
// The background fades between them: top to bottom when stacked, left to right from md.
export function TrackingHeader({
  vehicle,
  dealership,
  title,
  subtitle,
  status,
  gradient,
  onAdvance,
  advancing = false,
}: TrackingHeaderProps) {
  const Icon = statusIcons[status];
  const pillClass =
    "mt-4 flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-semibold backdrop-blur-sm";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-200",
        "bg-linear-to-b from-white from-35% to-50% md:bg-linear-to-r md:from-45% md:to-65%",
        gradient,
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center">
        {/* Vehicle */}
        <div className="flex items-center gap-5 p-4 md:w-[58%] md:p-5">
          <div className="flex h-[100px] w-[150px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f6f7f8] md:h-[130px] md:w-[200px]">
            <img
              src={vehicle.image}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              <VehicleTitle vehicle={vehicle} />
            </h2>

            <div className="mt-3 flex gap-6">
              <VehicleInfo label="VIN" value={maskedVin(vehicle.vin)} title={vehicle.vin} />
              <VehicleInfo label="MILES" value={vehicle.miles} />
            </div>
          </div>
        </div>

        {/* Status, centred over the coloured side */}
        <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-8 text-center text-white md:py-8">
          <p className="text-xs font-medium uppercase tracking-wide text-white/85">
            {dealership}
          </p>

          <h1 className="mt-1.5 text-xl font-bold tracking-tight md:text-2xl">
            {title}
          </h1>

          <p className="mt-1 text-sm text-white/85">
            {subtitle}
          </p>

          {onAdvance ? (
            <button
              type="button"
              onClick={onAdvance}
              disabled={advancing}
              title="Demo: move to the next status"
              className={cn(
                pillClass,
                "transition hover:bg-white/30 disabled:cursor-wait disabled:opacity-70",
              )}
            >
              <Icon size={16} strokeWidth={2} className="shrink-0" />
              {advancing ? "Updating..." : status}
            </button>
          ) : (
            <div className={pillClass}>
              <Icon size={16} strokeWidth={2} className="shrink-0" />
              {status}
            </div>
          )}
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
