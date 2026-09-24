import { useAppSelector } from "@/redux/hooks";
import { selectBookingVehicle } from "@/redux/booking/bookingSlice";

interface SelectedVehicleCardProps {
  onChange?: () => void;
}

export function SelectedVehicleCard({
  onChange,
}: SelectedVehicleCardProps) {
  const vehicle = useAppSelector(selectBookingVehicle);

  if (!vehicle) {
    return (
      <div className="flex items-center justify-between gap-6 rounded-2xl border border-dashed border-gray-300 bg-white p-6">
        <p className="text-sm text-gray-500">
          No vehicle selected.
        </p>

        <button
          type="button"
          onClick={onChange}
          className="shrink-0 rounded-lg bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
        >
          Select
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-gray-200 bg-white p-6">
      {/* Vehicle */}
      <div className="flex min-w-0 items-center gap-6">
        {/* Image */}
        <div className="flex h-[90px] w-[140px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f3f4f7]">
          <img
            src={vehicle.image}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Information */}
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {vehicle.brand === "JEEP"
              ? "Jeep"
              : vehicle.brand}{" "}
            {vehicle.model}
          </h3>

          <div className="mt-1 space-y-0.5 text-sm text-gray-500">
            <p>
              Year:{" "}
              <span className="text-gray-900">
                {vehicle.year}
              </span>
            </p>

            <p>
              VIN:{" "}
              <span className="text-gray-900">
                {vehicle.vin}
              </span>
            </p>

            <p>
              Miles:{" "}
              <span className="text-gray-900">
                {vehicle.miles}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Change */}
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-lg bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        Change
      </button>
    </div>
  );
}