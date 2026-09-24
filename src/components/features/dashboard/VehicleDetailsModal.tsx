import { X } from "reicon-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addVehicle } from "@/redux/vehicle/vehicleSlice";
import {
  closeVerifiedVehicle,
  rejectVerifiedVehicle,
  selectDashboardModal,
} from "@/redux/modals/dashboardModal/dashboardModalSlice";

// Shows the VIN lookup result so the user can confirm it before it is saved
export function VehicleDetailsModal() {
  const dispatch = useAppDispatch();
  const { verifiedVehicle: vehicle } = useAppSelector(selectDashboardModal);

  if (!vehicle) {
    return null;
  }

  const onClose = () => dispatch(closeVerifiedVehicle());

  const onAddVehicle = () => {
    dispatch(addVehicle(vehicle));
    toast.success(`${vehicle.brand} ${vehicle.model} added`);
  };

  const onNotMyVehicle = () => dispatch(rejectVerifiedVehicle());

  return (
    <div className="absolute inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal wrapper */}
      <div className="relative flex min-h-full items-center justify-center p-6">
        {/* Modal */}
        <div
          className="relative w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#111827]">
              Vehicle Details
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          {/* Vehicle image */}
          <div className="relative mt-5 h-[205px] overflow-hidden rounded-xl bg-white">
            <img
              src={vehicle.image}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-contain"
            />

            {/* Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Vehicle name */}
            <h3 className="absolute bottom-4 left-4 text-lg font-bold text-white">
              {vehicle.brand} {vehicle.model}
            </h3>
          </div>

          {/* Vehicle information */}
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
            {/* VIN */}
            <div>
              <p className="text-xs text-gray-500">
                VIN
              </p>

              <p className="mt-1 text-sm font-bold tracking-wide text-gray-900">
                {vehicle.vin}
              </p>
            </div>

            {/* Divider */}
            <div className="my-3 h-px bg-gray-200" />

            {/* Stats */}
            <div className="grid grid-cols-3">
              <VehicleStat
                label="Year"
                value={vehicle.year}
              />

              <VehicleStat
                label="Miles"
                value={vehicle.miles}
              />

              {/* <VehicleStat
                label="Color"
                value={vehicle.color}
              /> */}
            </div>
          </div>

          {/* Divider */}
          <div className="my-5 h-px bg-gray-200" />

          {/* Add vehicle */}
          <button
            type="button"
            onClick={onAddVehicle}
            className="h-12 w-full rounded-xl bg-[#111827] text-sm font-semibold text-white transition hover:bg-black"
          >
            Add Vehicle
          </button>

          {/* Not your vehicle */}
          <button
            type="button"
            onClick={onNotMyVehicle}
            className="mt-4 block w-full text-center text-sm font-semibold text-gray-700 transition hover:text-gray-900"
          >
            Not your vehicle
          </button>
        </div>
      </div>
    </div>
  );
}

function VehicleStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border-r border-gray-200 px-3 first:pl-0 last:border-r-0">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}