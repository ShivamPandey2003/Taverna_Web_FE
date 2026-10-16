import { brandName } from "@/libs/utils";
import type { Vehicle } from "@/types/vehicle";

// A vehicle's name on two lines, "2022 Jeep" over "Grand Cherokee", or on one
// with `singleLine` (cut short with "…" when it doesn't fit; the full name is in
// the tooltip). Renders inside the caller's heading, which sets the text style.
export function VehicleTitle({
  vehicle,
  singleLine = false,
}: {
  vehicle: Pick<Vehicle, "year" | "brand" | "model">;
  singleLine?: boolean;
}) {
  if (singleLine) {
    const name = `${vehicle.year} ${brandName(vehicle.brand)} ${vehicle.model}`;
    return (
      <span className="block truncate" title={name}>
        {name}
      </span>
    );
  }

  return (
    <>
      <span className="block truncate">
        {vehicle.year} {brandName(vehicle.brand)}
      </span>
      <span className="block truncate">{vehicle.model}</span>
    </>
  );
}
