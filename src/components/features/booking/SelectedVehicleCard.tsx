import { useAppSelector } from "@/redux/hooks";
import { selectBookingVehicle } from "@/redux/booking/bookingSlice";
import { brandName } from "@/libs/utils";

interface SelectedVehicleCardProps {
  onChange?: () => void;
}

const buttonClass =
  "shrink-0 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800";

export function SelectedVehicleCard({
  onChange,
}: SelectedVehicleCardProps) {
  const vehicle = useAppSelector(selectBookingVehicle);

  if (!vehicle) {
    return (
      <div className="flex items-center justify-between gap-6 rounded-2xl border border-dashed border-gray-300 bg-white p-4">
        <p className="text-sm text-gray-500">
          No vehicle selected.
        </p>

        <button type="button" onClick={onChange} className={buttonClass}>
          Select
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4">
      {/* Vehicle */}
      <div className="flex min-w-0 items-center gap-4">
        {/* Image */}
        <div className="flex h-[72px] w-[112px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f3f4f7]">
          <img
            src={vehicle.image}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Information */}
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-gray-900">
            {brandName(vehicle.brand)} {vehicle.model}
          </h3>

          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-0.5 text-sm text-gray-500">
            <p>
              Year: <span className="text-gray-900">{vehicle.year}</span>
            </p>

            <p className="min-w-0 truncate">
              VIN: <span className="text-gray-900">{vehicle.vin}</span>
            </p>

            <p>
              Miles: <span className="text-gray-900">{vehicle.miles}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Change */}
      <button type="button" onClick={onChange} className={buttonClass}>
        Change
      </button>
    </div>
  );
}
