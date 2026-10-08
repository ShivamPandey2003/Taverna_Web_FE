import { useRef, useState } from "react";
import { useMatch, useNavigate } from "react-router";
import { AngleLeft, AngleRight } from "reicon-react";
import { ServiceStatusIndicator } from "./ServiceStatusIndicator";
import {
  isOpenService,
  pickTrackedService,
  TRACKING_ROUTE,
  trackingPath,
  useActiveServices,
  type ActiveService,
} from "./serviceStatus";
import { VehicleTitle } from "@/components/features/dashboard/VehicleTitle";
import { cn, maskedVin, vehicleName } from "@/libs/utils";

// Floating card with the customer's service status. It can't be closed: it shows
// while a service runs and goes away once it's complete. With several vehicles in
// service it's a carousel, one card per booking: swipe / scroll sideways, or use
// the arrows and dots. On the tracking page the booking being looked at is left
// out, so what remains are the ways to the other ones.
export function ServiceStatusToast() {
  const services = useActiveServices();
  const trackingMatch = useMatch(TRACKING_ROUTE);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const viewedId = trackingMatch
    ? pickTrackedService(services, trackingMatch.params.bookingId)?.booking.id
    : undefined;
  const shown = services.filter(
    (service) => isOpenService(service) && service.booking.id !== viewedId,
  );

  if (shown.length === 0) {
    return null;
  }

  // The list can shrink (a service completes) while a later card is showing
  const current = Math.min(index, shown.length - 1);

  const goTo = (next: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: next * scroller.clientWidth, behavior: "smooth" });
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 bottom-4 z-40 w-[400px] max-w-[calc(100vw-32px)] animate-toast-in sm:right-6"
    >
      {/* One card wide. The padding (pulled back by the margin) keeps the cards'
          shadows from being clipped, and the gap is as wide as both paddings, so
          each card is exactly one scroller width from the next. */}
      <div
        ref={scrollerRef}
        onScroll={(event) => {
          const { scrollLeft, clientWidth } = event.currentTarget;
          setIndex(Math.round(scrollLeft / clientWidth));
        }}
        className="-m-4 flex snap-x snap-mandatory gap-8 overflow-x-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shown.map((service) => (
          <div key={service.booking.id} className="w-full shrink-0 snap-center">
            <ServiceCard service={service} />
          </div>
        ))}
      </div>

      {shown.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            aria-label="Previous booking"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-40"
          >
            <AngleLeft size={14} />
          </button>

          <div className="flex items-center gap-1.5 rounded-full bg-white px-2 py-1.5 shadow-sm">
            {shown.map((service, position) => (
              <button
                key={service.booking.id}
                type="button"
                onClick={() => goTo(position)}
                aria-label={`Booking ${position + 1} of ${shown.length}: ${vehicleName(service.booking.vehicle)}`}
                aria-current={position === current}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  position === current ? "w-4 bg-gray-900" : "w-1.5 bg-gray-300 hover:bg-gray-400",
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === shown.length - 1}
            aria-label="Next booking"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition hover:bg-gray-100 disabled:opacity-40"
          >
            <AngleRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

// One booking: the vehicle and where its service stands. Opens its tracking page.
function ServiceCard({ service }: { service: ActiveService }) {
  const navigate = useNavigate();
  const { booking, display } = service;
  const { vehicle } = booking;

  return (
    <div className="flex items-center rounded-[40px] border border-gray-100 bg-white py-2 pl-2 pr-4 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <button
        type="button"
        onClick={() => navigate(trackingPath(booking.id))}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        aria-label={`${vehicleName(vehicle)}, ${display.label}: ${display.message}. Open tracking`}
      >
        <img src={vehicle.image} alt="" className="h-14 w-24 shrink-0 object-contain" />

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-tight text-gray-900">
            <VehicleTitle vehicle={vehicle} />
          </p>
          <p className="truncate text-[11px] text-gray-500">VIN: {maskedVin(vehicle.vin)}</p>
        </div>

        <ServiceStatusIndicator display={display} />
      </button>
    </div>
  );
}
