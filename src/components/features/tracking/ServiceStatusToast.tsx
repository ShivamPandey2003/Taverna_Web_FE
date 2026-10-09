import { useMatch, useNavigate } from "react-router";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";
import {
  isOpenService,
  pickTrackedService,
  TRACKING_ROUTE,
  trackingPath,
  useActiveServices,
  type ActiveService,
} from "./serviceStatus";
import { cn, maskedVin, vehicleName } from "@/libs/utils";

// The customer's running services, floating in the bottom-right corner: one round
// bubble per booking showing just the vehicle. Hovering (or focusing) a bubble
// widens it into the vehicle and where its service stands; a click opens its
// tracking page. It can't be closed: a bubble goes away once its service is
// complete. On the tracking page the booking being looked at is left out, so what
// remains are the ways to the other ones.
export function ServiceStatusToast() {
  const services = useActiveServices();
  const trackingMatch = useMatch(TRACKING_ROUTE);

  const viewedId = trackingMatch
    ? pickTrackedService(services, trackingMatch.params.bookingId)?.booking.id
    : undefined;
  const shown = services.filter(
    (service) => isOpenService(service) && service.booking.id !== viewedId,
  );

  if (shown.length === 0) {
    return null;
  }

  return (
    // Newest on the right; a widening bubble pushes the others to the left
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-4 z-40 flex max-w-[calc(100vw-32px)] animate-toast-in flex-row-reverse flex-wrap-reverse items-center gap-3 sm:right-6"
    >
      {shown.map((service) => (
        <ServiceBubble key={service.booking.id} service={service} />
      ))}
    </div>
  );
}

// One booking: the vehicle's photo, widening on hover / focus to its name, VIN
// and status. Opens its tracking page.
function ServiceBubble({ service }: { service: ActiveService }) {
  const navigate = useNavigate();
  const { booking, display } = service;
  const { vehicle } = booking;

  return (
    <button
      type="button"
      onClick={() => navigate(trackingPath(booking.id))}
      aria-label={`${vehicleName(vehicle)}, ${display.label}: ${display.message}. Open tracking`}
      className="group flex h-16 max-w-full items-center rounded-full border border-gray-100 bg-white text-left shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    >
      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center">
        <img src={vehicle.image} alt="" className="h-12 w-14 object-contain" />
        {/* The status colour, so a closed bubble still hints where the service stands */}
        <span
          className={cn(
            "absolute top-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-current",
            display.color.text,
          )}
        />
      </span>

      {/* Closed until hovered or focused. The content keeps its width so the text
          doesn't reflow while the bubble widens. */}
      <span className="block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity] duration-300 ease-out group-hover:max-w-[320px] group-hover:opacity-100 group-focus-visible:max-w-[320px] group-focus-visible:opacity-100">
        <span className="flex w-[320px] items-center gap-3 pr-4 pl-1">
          <span className="block min-w-0 flex-1">
            <span className="block truncate text-[15px] font-bold leading-tight text-gray-900">
              {vehicleName(vehicle)}
            </span>
            <span className="block truncate text-[11px] text-gray-500">
              VIN: {maskedVin(vehicle.vin)}
            </span>
          </span>

          <ServiceStatusIndicator display={display} />
        </span>
      </span>
    </button>
  );
}
