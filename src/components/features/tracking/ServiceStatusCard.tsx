import { X } from "reicon-react";
import { useNavigate } from "react-router";
import { brandName, cn, maskedVin } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  completedCardClosed,
  selectCompletedCardDismissed,
} from "@/redux/tracking/trackingSlice";
import { BookingStatus } from "@/types/booking";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";
import { statusTones, TRACKING_PATH, useActiveService } from "./serviceStatus";

// Sidebar version of the status toast: always visible while a service is running.
// Once the service is complete it stays until the customer closes it.
export function ServiceStatusCard() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const service = useActiveService();
  const dismissed = useAppSelector(selectCompletedCardDismissed);

  const complete = service?.status === BookingStatus.SERVICE_COMPLETE;

  if (!service || (complete && dismissed)) {
    return null;
  }

  const { booking, display } = service;
  const { vehicle } = booking;

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white transition hover:border-gray-300 hover:shadow-sm">
      <button
        type="button"
        onClick={() => navigate(TRACKING_PATH)}
        className="w-full p-3 text-left"
        aria-label={`${display.label}: ${display.message}. Open tracking`}
      >
        <div className={cn("flex items-center gap-3", complete && "pr-6")}>
          <img src={vehicle.image} alt="" className="h-10 w-16 shrink-0 object-contain" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-gray-900">
              {brandName(vehicle.brand)}
            </p>
            <p className="truncate text-sm font-bold leading-tight text-gray-900">
              {vehicle.model}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-gray-500" title={vehicle.vin}>
              VIN: {maskedVin(vehicle.vin)}
            </p>
          </div>
        </div>

        {/* Status on the left, behind a dot that blinks while the service runs */}
        <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              !complete && "animate-pulse",
              statusTones[display.tone].bg,
            )}
          />
          <ServiceStatusIndicator display={display} size="sm" />
        </div>
      </button>

      {complete && (
        <button
          type="button"
          onClick={() => dispatch(completedCardClosed())}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
          aria-label="Close"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
