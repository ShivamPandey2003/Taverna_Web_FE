import { EmptyVehicleState } from "@/components/features/dashboard/EmptyVehicleState";
import { RegisterVehicleModal } from "@/components/features/dashboard/RegisterVehicleModal";
import { SavedVehicleDetailsModal } from "@/components/features/dashboard/SavedVehicleDetailsModal";
import { VehicleDetailsModal } from "@/components/features/dashboard/VehicleDetailsModal";
import { VehicleList } from "@/components/features/dashboard/VehicleList";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { cn } from "@/libs/utils";
import { selectAccountUser } from "@/redux/account/accountSlice";
import { openRegisterVehicle } from "@/redux/modals/dashboardModal/dashboardModalSlice";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import { useVehicles } from "@/services/queries/vehicleQueries";

export function Dashboard() {
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector(selectVehicles);
  const user = useAppSelector(selectAccountUser);
  // Same query the layout syncs into Redux; here only for its loading state
  const vehiclesQuery = useVehicles();
  const noVehiclesYet = vehicles.length === 0;

  return (
    // Bottom padding only under the vehicle list; the empty state fills the page exactly
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-y-auto",
        vehicles.length > 0 && "pb-10",
      )}
    >
      {noVehiclesYet && vehiclesQuery.isPending ? (
        <p className="flex flex-1 items-center justify-center text-sm text-gray-500">
          Loading your vehicles...
        </p>
      ) : noVehiclesYet && vehiclesQuery.isError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-gray-500">We couldn't load your vehicles.</p>
          <button
            type="button"
            onClick={() => vehiclesQuery.refetch()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Try again
          </button>
        </div>
      ) : noVehiclesYet ? (
        <EmptyVehicleState
          userName={user.name}
          onAddVehicle={() => dispatch(openRegisterVehicle())}
        />
      ) : (
        <>
          {/* Page Header: above the cards, whose photos would otherwise scroll over it */}
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-gray-50 px-10 py-4">
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
