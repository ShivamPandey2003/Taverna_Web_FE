import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { openVehicleDetails } from "@/redux/modals/dashboardModal/dashboardModalSlice";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import { VehicleCard } from "./VehicleCard";

export function VehicleList() {
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector(selectVehicles);

  return (
    <div className=" mt-4 px-10 grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onSelect={() => dispatch(openVehicleDetails(vehicle.id))}
        />
      ))}
    </div>
  );
}
