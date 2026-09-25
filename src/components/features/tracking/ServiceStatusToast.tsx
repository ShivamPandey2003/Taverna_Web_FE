import { X } from "reicon-react";
import { useMatch, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectDismissedStatus,
  statusToastDismissed,
} from "@/redux/tracking/trackingSlice";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";
import { TRACKING_PATH, useActiveService } from "./serviceStatus";

// Floating card with the customer's service status. Closing it hides it until
// the status changes; it stays out of the way on the tracking page itself.
export function ServiceStatusToast() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const service = useActiveService();
  const dismissedStatus = useAppSelector(selectDismissedStatus);
  const onTrackingPage = useMatch(TRACKING_PATH) !== null;

  if (!service || onTrackingPage || service.status === dismissedStatus) {
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
      <div className="flex items-center gap-2 rounded-[40px] border border-gray-100 bg-white py-2 pl-2 pr-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
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
            <p className="truncate text-[15px] font-bold text-gray-900">
              {vehicle.brand} {vehicle.model}
            </p>
            <p className="truncate text-[11px] text-gray-500">VIN: {vehicle.vin}</p>
            <p className="mt-1.5 truncate text-sm text-gray-700">{display.message}</p>
          </div>

          <ServiceStatusIndicator display={display} />
        </button>

        <button
          type="button"
          onClick={() => dispatch(statusToastDismissed(status))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
