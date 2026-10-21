import { cn } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBookingService, setSelectedService } from "@/redux/booking/bookingSlice";
import { services } from "@/components/features/booking/booking.data";

// The review page's title, doubling as the service switch: the selected service
// in the title's style, the other one greyed beside it. The page follows the
// selected service (schedule, driveable)
export function ServiceTabs({ disabled = false }: { disabled?: boolean }) {
  const dispatch = useAppDispatch();
  const selected = useAppSelector(selectBookingService);

  return (
    <div
      role="tablist"
      aria-label="Service type"
      className="flex flex-wrap items-baseline gap-x-6 gap-y-1"
    >
      {services.map((service) => {
        const active = service.id === selected.id;

        return (
          <button
            key={service.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => dispatch(setSelectedService(service.id))}
            className={cn(
              "text-2xl font-bold tracking-tight transition disabled:cursor-not-allowed",
              active ? "text-gray-900" : "text-gray-300 hover:text-gray-500",
            )}
          >
            {service.title}
          </button>
        );
      })}
    </div>
  );
}
