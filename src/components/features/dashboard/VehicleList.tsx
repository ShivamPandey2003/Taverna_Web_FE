import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSelectedService, setSelectedVehicle } from "@/redux/booking/bookingSlice";
import { openVehicleDetails } from "@/redux/modals/dashboardModal/dashboardModalSlice";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import {
  isOpenService,
  trackingPath,
  useActiveServices,
} from "@/components/features/tracking/serviceStatus";
import { VehicleCard } from "./VehicleCard";

export function VehicleList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vehicles = useAppSelector(selectVehicles);
  const services = useActiveServices();

  return (
    // As many columns of at least 300px as fit, sharing the full width: four on a
    // laptop screen. A card caps at 380px, which only shows with a single column.
    <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5 px-10">
      {vehicles.map((vehicle) => {
        // The vehicle's running service: its status takes the booking button's place
        const service =
          services.find((item) => item.booking.vehicle.vin === vehicle.vin && isOpenService(item)) ??
          null;

        return (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          service={service}
          onTrack={service ? () => navigate(trackingPath(service.booking.id)) : undefined}
          onSelect={() => dispatch(openVehicleDetails(vehicle.id))}
          // Book pickup skips the service list: straight to review with Pickup & Delivery
          onBook={() => {
            dispatch(setSelectedVehicle(vehicle.id));
            dispatch(setSelectedService("pickup-delivery"));
            navigate("/dashboard/book-service/review");
          }}
        />
        );
      })}
    </div>
  );
}
