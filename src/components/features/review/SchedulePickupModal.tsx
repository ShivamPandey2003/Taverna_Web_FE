import { useState } from "react";
import { Calendar, X } from "reicon-react";
import { cn, formatPickupTime } from "@/libs/utils";
import { useAppSelector } from "@/redux/hooks";
import { selectBooking } from "@/redux/booking/bookingSlice";

interface SchedulePickupModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

// How many days ahead a pickup can be booked, including today
const DAYS_AHEAD = 7;
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

          {/* Days */}
          <p className="mt-5 text-sm font-bold text-gray-900">Date</p>
          <div className="mt-2 grid grid-cols-7 gap-1.5 sm:gap-2">
            {days.map((day) => {
              const isSelected = isSameDay(day, selectedDay);
              const available = getSlots(day).some((slot) => isBookable(slot, now));

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={!available}
                  onClick={() => handleDayChange(day)}
                  className={cn(
                    "flex min-w-0 flex-col items-center rounded-xl border py-1.5 transition",
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-900 hover:border-gray-400",
                    "disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:hover:border-gray-100",
                  )}
                >
                  <span className={cn("text-[11px] font-medium", !isSelected && "text-gray-500")}>
                    {dayLabel(day, now)}
                  </span>
                  <span className="text-lg font-bold leading-tight">{day.getDate()}</span>
                  <span className={cn("text-[11px]", !isSelected && "text-gray-500")}>
                    {day.toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Times */}
          <p className="mt-5 text-sm font-bold text-gray-900">Time</p>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((slot) => {
              const isSelected = selected?.getTime() === slot.getTime();

              return (
                <button
                  key={slot.toISOString()}
                  type="button"
                  disabled={!isBookable(slot, now)}
                  onClick={() => setSelected(slot)}
                  className={cn(
                    "h-9 whitespace-nowrap rounded-lg border text-[13px] font-medium transition",
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-gray-200 text-gray-900 hover:border-gray-400",
                    "disabled:cursor-not-allowed disabled:border-gray-100 disabled:text-gray-300 disabled:hover:border-gray-100",
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

          {/* Actions */}
          <div className="mt-5 flex items-center gap-6">
            <button
              type="button"
              onClick={onClose}
              className="px-1 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && onConfirm(selected)}
              className="h-12 flex-1 rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
