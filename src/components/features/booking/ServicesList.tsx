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

interface ServicesListProps {
  // A service is already in progress
  disabled?: boolean;
}

export function ServicesList({ disabled = false }: ServicesListProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vehicles = useAppSelector(selectVehicles);
  const selectedVehicle = useAppSelector(selectBookingVehicle);

  const handleServiceSelect = (service: Service) => {
    if (disabled) {
      toast.error("You can book again once your current service is complete.");
      return;
    }

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
    // Side by side on wide screens so the whole page fits without scrolling
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {services.map((service) => (
        <ServiceBookingCard
          key={service.id}
          service={service}
          onSelect={handleServiceSelect}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
