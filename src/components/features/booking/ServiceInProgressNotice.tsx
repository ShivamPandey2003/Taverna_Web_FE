import { useNavigate } from "react-router";
import { cn, vehicleName } from "@/libs/utils";
import {
  trackingPath,
  type ActiveService,
} from "@/components/features/tracking/serviceStatus";

// Shown instead of booking while the picked vehicle's current service isn't
// complete (see useVehicleService). Other vehicles can still be booked.
export function ServiceInProgressNotice({ service }: { service: ActiveService }) {
  const navigate = useNavigate();

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-5">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
          This Vehicle Has a Service in Progress
          <span
            className={cn(
              "rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold",
              service.display.color.text,
            )}
          >
            {service.display.label}
          </span>
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          You can book your {vehicleName(service.booking.vehicle)} again once this service is
          complete. Your other vehicles can be booked now.
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate(trackingPath(service.booking.id))}
        className="shrink-0 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Track Service
      </button>
    </section>
  );
}
