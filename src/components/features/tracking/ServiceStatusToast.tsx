import { useEffect, useRef, useState } from "react";
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
// bubble per booking showing just the vehicle. Hovering a bubble opens a small
// card above it with that vehicle and where its service stands; a click opens
// its tracking page. It can't be dismissed: a bubble goes away once its service
// is complete. On the tracking page the booking being looked at is left out, so
// what remains are the ways to the other ones.
export function ServiceStatusToast() {
  const services = useActiveServices();
  const trackingMatch = useMatch(TRACKING_ROUTE);
  const rootRef = useRef<HTMLDivElement>(null);
  // The booking whose card is open, one at a time
  const [openId, setOpenId] = useState<string | null>(null);

  // A card opened by a tap (no hover there) closes on a tap outside or Escape
  useEffect(() => {
    if (!openId) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenId(null);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openId]);

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
    // Newest on the right
    <div
      ref={rootRef}
      className="fixed right-4 bottom-4 z-40 flex max-w-[calc(100vw-32px)] animate-toast-in flex-row-reverse flex-wrap-reverse items-center gap-3 sm:right-6"
    >
      {shown.map((service) => (
        <ServiceBubble
          key={service.booking.id}
          service={service}
          open={openId === service.booking.id}
          onOpenChange={(open) => setOpenId(open ? service.booking.id : null)}
        />
      ))}
    </div>
  );
}

interface ServiceBubbleProps {
  service: ActiveService;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// One booking: the vehicle's photo, with a card above it (name, VIN and status)
// while hovered. Both open the booking's tracking page.
function ServiceBubble({ service, open, onOpenChange }: ServiceBubbleProps) {
  const navigate = useNavigate();
  const { booking, display } = service;
  const { vehicle } = booking;

  const openTracking = () => {
    onOpenChange(false);
    navigate(trackingPath(booking.id));
  };

  return (
    <div
      className="relative"
      onPointerEnter={(event) => event.pointerType === "mouse" && onOpenChange(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && onOpenChange(false)}
    >
      {open && (
        // The padding bridges the gap to the bubble, so the mouse can cross it
        <div className="absolute right-0 bottom-full w-[340px] max-w-[calc(100vw-32px)] pb-3">
          <button
            type="button"
            onClick={openTracking}
            className="flex w-full animate-toast-in items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition hover:bg-gray-50"
          >
            <img src={vehicle.image} alt="" className="h-10 w-14 shrink-0 object-contain" />

            <span className="block min-w-0 flex-1">
              <span className="block truncate text-sm font-bold leading-tight text-gray-900">
                {vehicleName(vehicle)}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-gray-500">
                VIN: {maskedVin(vehicle.vin)}
              </span>
            </span>

            <ServiceStatusIndicator display={display} size="sm" />
          </button>
        </div>
      )}

      <button
        type="button"
        // A mouse click goes straight to tracking (the card is already showing);
        // a tap or the keyboard opens the card first, which then leads there
        onClick={(event) => {
          const { pointerType } = event.nativeEvent as PointerEvent;
          if (pointerType === "mouse" || open) openTracking();
          else onOpenChange(true);
        }}
        aria-expanded={open}
        aria-label={`${vehicleName(vehicle)}, ${display.label}: ${display.message}. Open tracking`}
        className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
      >
        <img src={vehicle.image} alt="" className="h-12 w-14 object-contain" />
        {/* The status colour, so a closed bubble still hints where the service stands */}
        <span
          className={cn(
            "absolute top-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-current",
            display.color.text,
          )}
        />
      </button>
    </div>
  );
}
