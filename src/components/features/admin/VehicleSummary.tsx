import { cn, vehicleName } from "@/libs/utils";
import { brandImage } from "@/libs/vehicleImage";

interface VehicleSummaryProps {
  vehicle: { year: number; brand: string; model: string; vin: string; image?: string };
  className?: string;
}

// A vehicle on one row: photo, "2021 Jeep Wrangler" and its VIN
export function VehicleSummary({ vehicle, className }: VehicleSummaryProps) {
  // Only the VIN's last 6, which is what gets matched against the windshield plate
  const vinEnd = vehicle.vin.slice(-6);

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      {/* Bookings don't carry the vehicle's photo yet, so this is the brand's stock one for now */}
      <img
        src={vehicle.image || brandImage(vehicle.brand)}
        alt=""
        className="h-11 w-16 shrink-0 object-contain"
      />
      <div className="min-w-0">
        <p className="truncate text-base font-bold text-gray-900">{vehicleName(vehicle)}</p>
        <p className="truncate text-xs text-gray-500" title={vehicle.vin}>
          VIN ***
          <strong className="font-bold text-gray-900">{vinEnd}</strong>
        </p>
      </div>
    </div>
  );
}
