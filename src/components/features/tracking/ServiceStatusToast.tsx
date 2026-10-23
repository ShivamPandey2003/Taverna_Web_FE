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
// card above it with that vehicle and where its service stands (mouse only); a
// click or tap opens its tracking page. It can't be dismissed: a bubble goes away
// once its service is complete. On the tracking page the booking being looked at
// is left out, so what remains are the ways to the other ones.
export function ServiceStatusToast() {
  const services = useActiveServices();
  const trackingMatch = useMatch(TRACKING_ROUTE);
  const rootRef = useRef<HTMLDivElement>(null);
  // The booking whose card is open (hovered), one at a time
  const [openId, setOpenId] = useState<string | null>(null);

  const viewedId = trackingMatch
    ? pickTrackedService(services, trackingMatch.params.bookingId)?.booking.id
    : undefined;
  const shown = services
    .filter((service) => isOpenService(service) && service.booking.id !== viewedId)
    .sort(newestFirst);
  const visible = shown.length > 0;

  // The bubbles float over the page, so each page leaves this much room at the end
  // of its scroll (the `status-bubble-space` spacer in index.css): their height,
  // which grows when they wrap to a second row on a phone, plus their offset
  useEffect(() => {
    const element = rootRef.current;
    const root = document.documentElement;
    if (!visible || !element) return;

    const update = () =>
      root.style.setProperty(BUBBLE_SPACE_VAR, `${element.offsetHeight + BUBBLE_MARGIN}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty(BUBBLE_SPACE_VAR);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    // Newest first, on the left; a row that doesn't fit wraps upwards
    <div
      ref={rootRef}
      // On phones above the bottom tab bar (MobileNav: 4rem + the home indicator)
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 md:bottom-4 flex max-w-[calc(100vw-32px)] animate-toast-in flex-wrap-reverse items-center justify-end gap-3 sm:right-6"
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

const BUBBLE_SPACE_VAR = "--status-bubble-space";
// The bubbles' bottom offset (bottom-4) and a gap above them
const BUBBLE_MARGIN = 16 + 16;

// Booking ids are numbered in the order they were made ("TD-039" after "TD-018"),
// which holds for bookings put back from the list too; when an id has no number
// the booking's own date decides
const bookingNumber = (id: string) => Number(id.match(/\d+/g)?.pop() ?? NaN);

function newestFirst(a: ActiveService, b: ActiveService) {
  const numberA = bookingNumber(a.booking.id);
  const numberB = bookingNumber(b.booking.id);
  if (!Number.isNaN(numberA) && !Number.isNaN(numberB) && numberA !== numberB) {
    return numberB - numberA;
  }
  return Date.parse(b.booking.createdAt) - Date.parse(a.booking.createdAt);
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
        // Straight to tracking, a tap included (no card first on touch screens,
        // where there's no hover); the card is only a mouse's hover preview
        onClick={openTracking}
        aria-label={`${vehicleName(vehicle)}, ${display.label}: ${display.message}. Open tracking`}
        // The border is the status colour (border-current takes the text colour), so a
        // closed bubble still hints where the service stands
        className={cn(
          "relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-current bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]",
          display.color.text,
        )}
      >
        <img src={vehicle.image} alt="" className="h-12 w-14 object-contain" />
      </button>
    </div>
  );
}
