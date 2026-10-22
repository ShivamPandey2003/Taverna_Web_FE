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
          {/* On phones: tighter padding, no description, and a short button label,
              so the title and button share one line */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 sm:items-start sm:px-10 sm:py-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                Vehicle List
              </h1>

              <p className="mt-1 hidden text-sm text-gray-500 sm:block">
                View and manage all your vehicles in one place.
              </p>
            </div>

            <button
              onClick={() => dispatch(openRegisterVehicle())}
              aria-label="Add New Vehicle"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <span className="text-md leading-none">+</span>
              <span className="sm:hidden">Add Vehicle</span>
              <span className="hidden sm:inline">Add New Vehicle</span>
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
