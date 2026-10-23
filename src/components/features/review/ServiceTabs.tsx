import { useEffect, useRef, useState } from "react";
import { ArrowDown2, TickCircle } from "reicon-react";
import { cn } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBookingService, setSelectedService } from "@/redux/booking/bookingSlice";
import { services } from "@/components/features/booking/booking.data";
import type { ServiceId } from "@/types/service";

// The review page's title, doubling as the service switch. The page follows the
// selected service (schedule, driveable).
export function ServiceTabs({ disabled = false }: { disabled?: boolean }) {
  const dispatch = useAppDispatch();
  const selected = useAppSelector(selectBookingService);
  const select = (id: ServiceId) => dispatch(setSelectedService(id));

  return (
    <>
      <ServiceMenu selectedId={selected.id} disabled={disabled} onSelect={select} />

      {/* From sm: the selected service in the title's style, the other one greyed beside it */}
      <div
        role="tablist"
        aria-label="Service type"
        className="hidden flex-wrap items-baseline gap-x-6 gap-y-1 sm:flex"
      >
        {services.map((service) => {
          const active = service.id === selected.id;

          return (
            <button
              key={service.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => select(service.id)}
              className={cn(
                "text-2xl font-bold tracking-tight transition disabled:cursor-not-allowed",
                active ? "text-gray-900" : "text-gray-300 hover:text-gray-500",
              )}
            >
              {service.title}
            </button>
          );
        })}
      </div>
    </>
  );
}

// Phones, where the two titles would stack: the selected service as the title
// with a chevron, opening a menu of both services with their descriptions
function ServiceMenu({
  selectedId,
  disabled,
  onSelect,
}: {
  selectedId: ServiceId;
  disabled: boolean;
  onSelect: (id: ServiceId) => void;
}) {
  // While open: how far down the screen the menu starts (just under the title)
  const [menuTop, setMenuTop] = useState<number | null>(null);
  const open = menuTop !== null;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const close = () => setMenuTop(null);
  const toggle = () =>
    setMenuTop(open ? null : (buttonRef.current?.getBoundingClientRect().bottom ?? 0) + 8);
  const selected = services.find((service) => service.id === selectedId) ?? services[0];

  // Closes on a tap outside, Escape, or a scroll (the menu is placed on the
  // screen, so it would no longer sit under the title)
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuTop(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuTop(null);
    };
    const onScroll = () => setMenuTop(null);

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative sm:hidden">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Service type: ${selected.title}`}
        className="flex max-w-full items-center gap-2 text-left disabled:cursor-not-allowed"
      >
        <span className="truncate text-xl font-bold tracking-tight text-gray-900">
          {selected.title}
        </span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200/70 text-gray-700">
          <ArrowDown2
            size={14}
            strokeWidth={2.5}
            className={cn("transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {/* The title starts after the back arrow, so the menu is placed on the
          screen (16px from each side) rather than under the title, where it ran
          off the right edge */}
      {open && (
        <ul
          role="listbox"
          aria-label="Service type"
          style={{ top: menuTop }}
          className="fixed inset-x-4 z-30 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          {services.map((service) => {
            const active = service.id === selectedId;

            return (
              <li key={service.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onSelect(service.id);
                    close();
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    active ? "bg-gray-50" : "hover:bg-gray-50",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-gray-900">{service.title}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                      {service.description}
                    </span>
                  </span>
                  <TickCircle
                    size={18}
                    className={cn("mt-0.5 shrink-0", active ? "text-gray-900" : "invisible")}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
