import { useMatch, useNavigate } from "react-router";
import { BookingStatus } from "@/types/booking";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";
import { TRACKING_PATH, useActiveService } from "./serviceStatus";
import { VehicleTitle } from "@/components/features/dashboard/VehicleTitle";
import { maskedVin } from "@/libs/utils";

// Floating card with the customer's service status. It can't be closed: it shows
// while the service runs and goes away once it's complete. It stays out of the way
// on the tracking page itself.
export function ServiceStatusToast() {
  const navigate = useNavigate();
  const service = useActiveService();
  const onTrackingPage = useMatch(TRACKING_PATH) !== null;

  if (!service || onTrackingPage || service.status === BookingStatus.SERVICE_COMPLETE) {
    return null;
  }

  const { booking, status, display } = service;
  const { vehicle } = booking;

  return (
    <div
      // Keyed by status so each update slides in again
      key={status}
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-4 z-40 w-[400px] max-w-[calc(100vw-32px)] animate-toast-in sm:right-6"
    >
      <div className="flex items-center rounded-[40px] border border-gray-100 bg-white py-2 pl-2 pr-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <button
          type="button"
          onClick={() => navigate(TRACKING_PATH)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`${display.label}: ${display.message}. Open tracking`}
        >
          <img
            src={vehicle.image}
            alt=""
            className="h-14 w-24 shrink-0 object-contain"
          />

          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold leading-tight text-gray-900">
              <VehicleTitle vehicle={vehicle} />
            </p>
            <p className="truncate text-[11px] text-gray-500">VIN: {maskedVin(vehicle.vin)}</p>
            <p className="mt-1.5 truncate text-sm text-gray-700">{display.message}</p>
          </div>

          <ServiceStatusIndicator display={display} />
        </button>
      </div>
    </div>
  );
}
