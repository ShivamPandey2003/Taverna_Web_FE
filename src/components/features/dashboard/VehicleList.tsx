import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSelectedService, setSelectedVehicle } from "@/redux/booking/bookingSlice";
import { openVehicleDetails } from "@/redux/modals/dashboardModal/dashboardModalSlice";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import { VehicleCard } from "./VehicleCard";

export function VehicleList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vehicles = useAppSelector(selectVehicles);

  return (
    // Columns as wide as a card (it caps at 380px), as many as fit: equal-width
    // columns left a wide empty strip beside each card
    <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),380px))] gap-5 px-10">
      {vehicles.map((vehicle) => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onSelect={() => dispatch(openVehicleDetails(vehicle.id))}
          // Book pickup skips the service list: straight to review with Pickup & Delivery
          onBook={() => {
            dispatch(setSelectedVehicle(vehicle.id));
            dispatch(setSelectedService("pickup-delivery"));
            navigate("/dashboard/book-service/review");
          }}
        />
      ))}
    </div>
  );
}
