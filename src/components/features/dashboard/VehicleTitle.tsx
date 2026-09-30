import { brandName } from "@/libs/utils";
import type { Vehicle } from "@/types/vehicle";

// A vehicle's name on two lines, "2022 Jeep" over "Grand Cherokee". Renders inside
// the caller's heading, which sets the text style.
export function VehicleTitle({ vehicle }: { vehicle: Pick<Vehicle, "year" | "brand" | "model"> }) {
  return (
    <>
      <span className="block truncate">
        {vehicle.year} {brandName(vehicle.brand)}
      </span>
      <span className="block truncate">{vehicle.model}</span>
    </>
  );
}
