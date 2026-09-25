import { useNavigate } from "react-router";
import { cn } from "@/libs/utils";
import { BookingStatus } from "@/types/booking";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";
import { TRACKING_PATH, useActiveService } from "./serviceStatus";

// Sidebar version of the status toast: always visible while a service is running
export function ServiceStatusCard() {
  const navigate = useNavigate();
  const service = useActiveService();

  if (!service || service.status === BookingStatus.SERVICE_COMPLETE) {
    return null;
  }

  const { booking, display } = service;
  const { vehicle } = booking;

  return (
    <button
      type="button"
      onClick={() => navigate(TRACKING_PATH)}
      className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-left transition hover:border-gray-300 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <img src={vehicle.image} alt="" className="h-10 w-16 shrink-0 object-contain" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-gray-900">
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="truncate text-[11px] text-gray-500">VIN: {vehicle.vin}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <p className="flex min-w-0 items-center gap-2 text-xs text-gray-600">
          <span
            className={cn(
              "h-2 w-2 shrink-0 animate-pulse rounded-full",
              display.tone === "pending" ? "bg-status-pending" : "bg-status-active",
            )}
          />
          <span className="truncate">{display.message}</span>
        </p>

        <ServiceStatusIndicator display={display} size="sm" />
      </div>
    </button>
  );
}
