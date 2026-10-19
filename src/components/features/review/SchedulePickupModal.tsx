import { useState } from "react";
import { AngleLeft, AngleRight, Calendar, X } from "reicon-react";
import { cn, formatPickupTime } from "@/libs/utils";
import { useAppSelector } from "@/redux/hooks";
import { selectBooking } from "@/redux/booking/bookingSlice";

interface SchedulePickupModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

// How many days ahead a pickup can be booked, including today: three weeks,
// shown a week (DAYS_PER_PAGE) at a time
const DAYS_AHEAD = 21;
const DAYS_PER_PAGE = 7;
// Pickup slots run from 8:00 AM to 6:00 PM, every 30 minutes
const FIRST_SLOT_HOUR = 8;
const LAST_SLOT_HOUR = 18;
const SLOT_MINUTES = 30;
// A valet needs at least this long to get to the customer
const MIN_LEAD_MINUTES = 60;

export function SchedulePickupModal({
  open,
  onClose,
  onConfirm,
}: SchedulePickupModalProps) {
  // Mount the picker only while open so it starts from the current time
  if (!open) {
    return null;
  }

  return (
    <SchedulePickupContent
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function SchedulePickupContent({
  onClose,
  onConfirm,
}: Omit<SchedulePickupModalProps, "open">) {
  const { scheduledAt } = useAppSelector(selectBooking);

  const [now] = useState(() => new Date());
  const days = getDays(now);

  // Start from the time already scheduled if it's still bookable, else the first open slot
  const [selected, setSelected] = useState<Date | null>(() => {
    const current = scheduledAt ? new Date(scheduledAt) : null;
    if (current && isBookable(current, now)) return current;
    return days.flatMap((day) => getSlots(day)).find((slot) => isBookable(slot, now)) ?? null;
  });

  const [selectedDay, setSelectedDay] = useState<Date>(() =>
    selected ? startOfDay(selected) : days[0],
  );

  const slots = getSlots(selectedDay);
  const pageCount = Math.ceil(days.length / DAYS_PER_PAGE);
  // The week on show; starts on the one holding the selected day
  const [page, setPage] = useState(() =>
    Math.max(0, Math.floor(days.findIndex((day) => isSameDay(day, selectedDay)) / DAYS_PER_PAGE)),
  );
  const pageDays = days.slice(page * DAYS_PER_PAGE, (page + 1) * DAYS_PER_PAGE);
  // Why a disabled day or time can't be picked, shown over it on hover, focus or tap
  const [hint, setHint] = useState<Hint | null>(null);
  // The days slide away under the pointer, so a hint showing would be left behind
  const showPage = (next: number) => {
    setHint(null);
    setPage(next);
  };
  const hintProps = (reason: string | null) =>
    reason
      ? {
          onMouseEnter: (event: React.MouseEvent<HTMLElement>) => setHint(toHint(reason, event.currentTarget)),
          onFocus: (event: React.FocusEvent<HTMLElement>) => setHint(toHint(reason, event.currentTarget)),
          onMouseLeave: () => setHint(null),
          onBlur: () => setHint(null),
        }
      : {};

  const handleDayChange = (day: Date) => {
    setSelectedDay(day);
    // Keep the same time of day when it's open on the new day
    const sameTime = selected && getSlots(day).find(
      (slot) => slot.getHours() === selected.getHours() && slot.getMinutes() === selected.getMinutes(),
    );
    setSelected(sameTime && isBookable(sameTime, now) ? sameTime : null);
  };

  return (
    // Fixed to the screen so the page behind never scrolls or shows past the backdrop
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal wrapper */}
      <div className="relative flex h-full items-center justify-center p-4">
        {/* Modal; scrolls inside itself only on very short screens */}
        <div
          className="relative max-h-full w-full max-w-[600px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              Schedule Your Pickup
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Pick a day and time for your valet to collect your vehicle.
          </p>

          {/* Days, a week at a time; the arrows page through the three weeks */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-gray-900">Date</p>

            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-gray-500">
                {rangeLabel(pageDays[0], pageDays[pageDays.length - 1])}
              </p>
              <PageButton
                label="Previous week"
                disabled={page === 0}
                onClick={() => showPage(page - 1)}
              >
                <AngleLeft size={16} />
              </PageButton>
              <PageButton
                label="Next week"
                disabled={page === pageCount - 1}
                onClick={() => showPage(page + 1)}
              >
                <AngleRight size={16} />
              </PageButton>
            </div>
          </div>

          {/* Every week side by side; the track slides to the one on show */}
          <div className="-mx-1 mt-2 overflow-hidden px-1 py-0.5">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${page * 100}%)` }}
            >
              {Array.from({ length: pageCount }, (_, index) => (
                <div
                  key={index}
                  className="grid w-full shrink-0 grid-cols-7 gap-1.5 sm:gap-2"
                  // Days off screen can't be tabbed to
                  inert={index !== page}
                >
                  {days.slice(index * DAYS_PER_PAGE, (index + 1) * DAYS_PER_PAGE).map((day) => {
                    const isSelected = isSameDay(day, selectedDay);
                    const available = getSlots(day).some((slot) => isBookable(slot, now));

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        // aria-disabled, not disabled: a disabled button gets no hover, so no hint
                        aria-disabled={!available}
                        onClick={(event) =>
                          available
                            ? handleDayChange(day)
                            : setHint(toHint(NO_TIMES_LEFT, event.currentTarget))
                        }
                        {...hintProps(available ? null : NO_TIMES_LEFT)}
                        className={cn(
                          "flex min-w-0 flex-col items-center rounded-xl border py-1.5 transition",
                          isSelected
                            ? "border-black bg-black text-white"
                            : "border-gray-200 text-gray-900 hover:border-gray-400",
                          "aria-disabled:cursor-not-allowed aria-disabled:border-gray-100 aria-disabled:text-gray-300 aria-disabled:hover:border-gray-100",
                        )}
                      >
                        <span className={cn("text-[11px] font-medium", !isSelected && available && "text-gray-500")}>
                          {dayLabel(day, now)}
                        </span>
                        <span className="text-lg font-bold leading-tight">{day.getDate()}</span>
                        <span className={cn("text-[11px]", !isSelected && available && "text-gray-500")}>
                          {day.toLocaleDateString("en-US", { month: "short" })}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Times */}
          <p className="mt-5 text-sm font-bold text-gray-900">Time</p>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((slot) => {
              const isSelected = selected?.getTime() === slot.getTime();
              const reason = unavailableReason(slot, now);

              return (
                <button
                  key={slot.toISOString()}
                  type="button"
                  // aria-disabled, not disabled: a disabled button gets no hover, so no hint
                  aria-disabled={!!reason}
                  onClick={(event) =>
                    reason ? setHint(toHint(reason, event.currentTarget)) : setSelected(slot)
                  }
                  {...hintProps(reason)}
                  className={cn(
                    "h-9 whitespace-nowrap rounded-lg border text-[13px] font-medium transition",
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-900 hover:border-gray-400",
                    "aria-disabled:cursor-not-allowed aria-disabled:border-gray-100 aria-disabled:text-gray-300 aria-disabled:hover:border-gray-100",
                  )}
                >
                  {slot.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </button>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
            <Calendar size={18} className="shrink-0 text-gray-700" />
            <p className="text-sm text-gray-700">
              {selected ? (
                <>
                  Pickup on{" "}
                  <span className="font-bold text-gray-900">{formatPickupTime(selected)}</span>
                </>
              ) : (
                "Select a time"
              )}
            </p>
          </div>

          {/* Actions: Cancel 40%, Confirm 60% */}
          <div className="mt-5 grid grid-cols-5 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="col-span-2 h-12 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && onConfirm(selected)}
              className="col-span-3 h-12 rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>

      {/* The hint over a disabled day or time; fixed to the screen so the modal's
          edges never cut it off, and kept clear of the screen's sides */}
      {hint && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-[60] w-max max-w-[220px] -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-2 text-center text-xs font-medium leading-snug text-white shadow-lg"
          style={{ left: hint.x, top: hint.y - 8 }}
        >
          {hint.text}
        </div>
      )}
    </div>
  );
}

const NO_TIMES_LEFT = "No pickup times left on this day";

interface Hint {
  text: string;
  x: number;
  y: number;
}

// Centred over the element, at least 120px (half the hint's width) from either side
function toHint(text: string, element: HTMLElement): Hint {
  const rect = element.getBoundingClientRect();
  const x = Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120);
  return { text, x, y: rect.top };
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:border-gray-400 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200"
    >
      {children}
    </button>
  );
}

// "Oct 19 – 25", or "Oct 27 – Nov 2" across two months
function rangeLabel(first: Date, last: Date) {
  const month = (date: Date) => date.toLocaleDateString("en-US", { month: "short" });
  return first.getMonth() === last.getMonth()
    ? `${month(first)} ${first.getDate()} – ${last.getDate()}`
    : `${month(first)} ${first.getDate()} – ${month(last)} ${last.getDate()}`;
}

// Why a time can't be picked, or null when it can
function unavailableReason(slot: Date, now: Date) {
  if (isBookable(slot, now)) return null;
  if (slot.getTime() <= now.getTime()) return "This time has already passed";
  if (slot.getTime() < now.getTime() + MIN_LEAD_MINUTES * 60_000)
    return "Too soon: pickups need at least 1 hour's notice so a valet can reach you";
  return "This time is outside the booking window";
}

function startOfDay(date: Date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function getDays(now: Date) {
  return Array.from({ length: DAYS_AHEAD }, (_, offset) => {
    const day = startOfDay(now);
    day.setDate(day.getDate() + offset);
    return day;
  });
}

function getSlots(day: Date) {
  const slots: Date[] = [];
  for (let minutes = FIRST_SLOT_HOUR * 60; minutes <= LAST_SLOT_HOUR * 60; minutes += SLOT_MINUTES) {
    const slot = new Date(day);
    slot.setHours(0, minutes, 0, 0);
    slots.push(slot);
  }
  return slots;
}

// Open slots are at least MIN_LEAD_MINUTES away and within the booking window
function isBookable(slot: Date, now: Date) {
  const lastDay = startOfDay(now);
  lastDay.setDate(lastDay.getDate() + DAYS_AHEAD);
  return slot.getTime() >= now.getTime() + MIN_LEAD_MINUTES * 60_000 && slot < lastDay;
}

function isSameDay(first: Date, second: Date) {
  return first.toDateString() === second.toDateString();
}

function dayLabel(day: Date, now: Date) {
  const diff = Math.round((day.getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tmrw";
  return day.toLocaleDateString("en-US", { weekday: "short" });
}
