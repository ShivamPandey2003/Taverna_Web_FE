import { vehicleName } from "@/libs/utils";
import { X } from "reicon-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addVehicle } from "@/redux/vehicle/vehicleSlice";
import {
  closeVerifiedVehicle,
  rejectVerifiedVehicle,
  selectDashboardModal,
} from "@/redux/modals/dashboardModal/dashboardModalSlice";
import { VehicleTitle } from "@/components/features/dashboard/VehicleTitle";
import { useSaveVehicle } from "@/services/queries/vehicleQueries";

// Shows the VIN lookup result so the user can confirm it before it is saved
export function VehicleDetailsModal() {
  const dispatch = useAppDispatch();
  const { verifiedVehicle: vehicle } = useAppSelector(selectDashboardModal);
  const saveVehicle = useSaveVehicle();

  if (!vehicle) {
    return null;
  }

  const onClose = () => dispatch(closeVerifiedVehicle());

  // Saved on the server first; adding it to Redux closes this modal
  const onAddVehicle = () =>
    saveVehicle.mutate(vehicle, {
      onSuccess: (saved) => {
        dispatch(addVehicle(saved));
        toast.success(`${vehicleName(saved)} added`);
      },
    });

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

          {/* Laid out like the dashboard's VehicleCard: the photo on its own,
              then the name, then the stats (the full VIN here, since it's
              being checked; miles only when the lookup found them) */}
          <div className="mt-5 overflow-hidden rounded-2xl bg-white">
            <div className="flex h-[180px] items-center justify-center overflow-hidden">
              <img
                src={vehicle.image}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="h-full w-full object-contain"
              />
            </div>

            <div className="py-5">
              <h3 className="text-xl font-bold leading-tight text-gray-900">
                <VehicleTitle vehicle={vehicle} singleLine />
              </h3>

              <div className="my-5 h-px bg-gray-200" />

              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <VehicleStat label="VIN" value={vehicle.vin} />

                {vehicle.miles && (
                  <VehicleStat label="Miles" value={vehicle.miles} />
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-5 h-px bg-gray-200" />

          {/* Add vehicle */}
          <button
            type="button"
            onClick={onAddVehicle}
            disabled={saveVehicle.isPending}
            className="h-12 w-full rounded-xl bg-[#111827] text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveVehicle.isPending ? "Adding..." : "Add Vehicle"}
          </button>

          {/* Not your vehicle */}
          <button
            type="button"
            onClick={onNotMyVehicle}
            disabled={saveVehicle.isPending}
            className="disabled:opacity-50 mt-4 block w-full text-center text-sm font-semibold text-gray-700 transition hover:text-gray-900"
          >
            Not Your Vehicle
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
    <div>
      <p className="text-xs font-medium text-gray-800">{label}</p>

      <p className="mt-1 break-all text-sm font-semibold tracking-wide text-gray-900">
        {value}
      </p>
    </div>
  );
}