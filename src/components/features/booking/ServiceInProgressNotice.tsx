import { useNavigate } from "react-router";
import { cn } from "@/libs/utils";
import {
  TRACKING_PATH,
  useActiveService,
} from "@/components/features/tracking/serviceStatus";

// Shown instead of booking while the customer's current service isn't complete
export function ServiceInProgressNotice() {
  const navigate = useNavigate();
  const service = useActiveService();

  const vehicle = service
    ? `your ${service.booking.vehicle.brand} ${service.booking.vehicle.model}`
    : "your current service";

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          You have a service in progress
          {service && (
            <span
              className={cn(
                "rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold",
                service.display.tone === "pending"
                  ? "text-status-pending"
                  : "text-status-active",
              )}
            >
              {service.display.label}
            </span>
          )}
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          You can book another service once {vehicle} is complete.
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate(TRACKING_PATH)}
        className="shrink-0 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Track Service
      </button>
    </section>
  );
}
