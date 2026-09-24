import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ServiceBookingCard } from "./ServiceBookingCard";
import { services } from "./booking.data";
import type { Service } from "@/types/service";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectBookingVehicle,
  setSelectedService,
} from "@/redux/booking/bookingSlice";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import { openSelectVehicle } from "@/redux/modals/bookServiceModal/bookServiceModalSlice";

export function ServicesList() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vehicles = useAppSelector(selectVehicles);
  const selectedVehicle = useAppSelector(selectBookingVehicle);

  const handleServiceSelect = (service: Service) => {
    if (!selectedVehicle) {
      if (vehicles.length === 0) {
        toast.error("Add a vehicle before booking a service.");
      } else {
        toast.error("Select a vehicle first.");
        dispatch(openSelectVehicle());
      }
      return;
    }

    dispatch(setSelectedService(service.id));
    navigate("/dashboard/book-service/review");
  };

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <ServiceBookingCard
          key={service.id}
          service={service}
          onSelect={handleServiceSelect}
        />
      ))}
    </div>
  );
}
