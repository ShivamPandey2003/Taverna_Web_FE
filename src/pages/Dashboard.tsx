import { EmptyVehicleState } from "@/components/features/dashboard/EmptyVehicleState";
import { RegisterVehicleModal } from "@/components/features/dashboard/RegisterVehicleModal";
import { SavedVehicleDetailsModal } from "@/components/features/dashboard/SavedVehicleDetailsModal";
import { VehicleDetailsModal } from "@/components/features/dashboard/VehicleDetailsModal";
import { VehicleList } from "@/components/features/dashboard/VehicleList";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAccountUser } from "@/redux/account/accountSlice";
import { openRegisterVehicle } from "@/redux/modals/dashboardModal/dashboardModalSlice";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";

export function Dashboard() {
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector(selectVehicles);
  const user = useAppSelector(selectAccountUser);

  return (
    <div className="flex h-full min-h-0 flex-col pb-10 overflow-y-auto">
      {vehicles.length === 0 ? (
        <EmptyVehicleState
          userName={user.name}
          onAddVehicle={() => dispatch(openRegisterVehicle())}
        />
      ) : (
        <>
          {/* Page Header */}
          <div className="flex items-start justify-between sticky top-0 py-4 border-b border-gray-100 px-10 bg-gray-50">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Vehicle List
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                View and manage all your vehicles in one place.
              </p>
            </div>

            <button
              onClick={() => dispatch(openRegisterVehicle())}
              className="flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <span className="text-md leading-none">+</span>
              Add New Vehicle
            </button>
          </div>

          {/* Vehicles */}
          <VehicleList />
        </>
      )}

      <RegisterVehicleModal />
      <VehicleDetailsModal />
      <SavedVehicleDetailsModal />
    </div>
  );
}
