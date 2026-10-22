import { useNavigate } from "react-router";
import { cn, vehicleName } from "@/libs/utils";
import {
  statusIcons,
  trackingPath,
  type ActiveService,
} from "@/components/features/tracking/serviceStatus";

// Shown instead of booking while the picked vehicle's current service isn't
// complete (see useVehicleService). Other vehicles can still be booked.
export function ServiceInProgressNotice({ service }: { service: ActiveService }) {
  const navigate = useNavigate();
  const StatusIcon = statusIcons[service.status];

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
      <div className="min-w-0">
        {/* Where the service stands, on its own line above the title so a long
            status never squeezes the heading */}
        <span
          className={cn(
            "inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold",
            service.display.color.text,
          )}
        >
          <StatusIcon size={14} className="shrink-0" />
          <span className="truncate">{service.display.label}</span>
        </span>

        <h2 className="mt-2 text-base font-bold leading-snug text-gray-900">
          This Vehicle Has a Service in Progress
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          You can book your {vehicleName(service.booking.vehicle)} again once this service is
          complete. Your other vehicles can be booked now.
        </p>
      </div>

      <button
        type="button"
        onClick={() => navigate(trackingPath(service.booking.id))}
        className="w-full shrink-0 rounded-lg bg-black px-5 py-2.5 sm:w-auto text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Track Service
      </button>
    </section>
  );
}
