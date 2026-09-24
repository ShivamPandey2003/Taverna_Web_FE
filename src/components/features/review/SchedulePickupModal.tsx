import { useMemo, useState } from "react";
import { X } from "reicon-react";

interface SchedulePickupModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
}

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
  const [today] = useState(() => new Date());

  const [selectedDate, setSelectedDate] =
    useState<Date>(today);

  const [selectedHour, setSelectedHour] =
    useState(today.getHours());

  const [selectedMinute, setSelectedMinute] =
    useState(today.getMinutes());

  const handleConfirm = () => {
    const date = new Date(selectedDate);

    date.setHours(selectedHour);
    date.setMinutes(selectedMinute);
    date.setSeconds(0);
    date.setMilliseconds(0);

    onConfirm(date);
  };

  return (
    <div className="absolute inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal wrapper */}
      <div className="relative flex min-h-full items-center justify-center overflow-y-auto p-6">
        {/* Modal */}
        <div
          className="relative w-full max-w-[520px] rounded-2xl bg-white p-8 shadow-2xl"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#111827]">
              Schedule Your Pickup
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X size={17} />
            </button>
          </div>

          {/* Description */}
          <p className="mt-7 max-w-[450px] text-sm leading-5 text-gray-500">
            Choose which date and exact time slot you want
            Taverna drivers to pick up your vehicle.
          </p>

          {/* Picker */}
          <SchedulePicker
            selectedDate={selectedDate}
            selectedHour={selectedHour}
            selectedMinute={selectedMinute}
            onDateChange={setSelectedDate}
            onHourChange={setSelectedHour}
            onMinuteChange={setSelectedMinute}
          />

          {/* Pickup information */}
          <PickupSummary
            date={selectedDate}
            hour={selectedHour}
            minute={selectedMinute}
          />

          {/* Divider */}
          <div className="my-6 h-px bg-gray-200" />

          {/* Actions */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={onClose}
              className="px-1 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="h-12 flex-1 rounded-lg bg-[#1f2937] text-sm font-semibold text-white transition hover:bg-[#111827]"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDateOptions(selectedDate: Date) {
  return [-2, -1, 0, 1, 2].map((offset) => {
    const date = new Date(selectedDate);

    date.setDate(
      selectedDate.getDate() + offset
    );

    return date;
  });
}

function formatDateOption(
  date: Date,
  selectedDate: Date
) {
  if (isSameDay(date, selectedDate)) {
    return "Today";
  }

  const diff =
    Math.round(
      (date.getTime() -
        selectedDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );

  if (diff === -1) {
    return "Yesterday";
  }

  if (diff === 1) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function isSameDay(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function getHourOptions(hour: number) {
  return [
    hour - 2,
    hour - 1,
    hour,
    hour + 1,
    hour + 2,
  ].map((value) => {
    if (value < 0) {
      return value + 24;
    }

    if (value >= 24) {
      return value - 24;
    }

    return value;
  });
}

function getMinuteOptions(minute: number) {
  return [
    minute - 2,
    minute - 1,
    minute,
    minute + 1,
    minute + 2,
  ].map((value) => {
    if (value < 0) {
      return value + 60;
    }

    if (value >= 60) {
      return value - 60;
    }

    return value;
  });
}

interface PickupSummaryProps {
  date: Date;
  hour: number;
  minute: number;
}

function PickupSummary({
  hour,
  minute,
}: PickupSummaryProps) {
  const formattedTime =
    `${String(hour).padStart(2, "0")}:` +
    `${String(minute).padStart(2, "0")}`;

  return (
    <div className="mt-5 text-center">
      <p className="text-base font-bold text-gray-900">
        {formattedTime} IST pickup time
      </p>

      <p className="mt-1 text-sm text-gray-500">
        About 10 min ride to the hub
      </p>
    </div>
  );
}

interface SchedulePickerProps {
  selectedDate: Date;
  selectedHour: number;
  selectedMinute: number;

  onDateChange: (date: Date) => void;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
}

function SchedulePicker({
  selectedDate,
  selectedHour,
  selectedMinute,
  onDateChange,
  onHourChange,
  onMinuteChange,
}: SchedulePickerProps) {
  const dates = useMemo(() => {
    return getDateOptions(selectedDate);
  }, [selectedDate]);

  const hours = getHourOptions(selectedHour);
  const minutes = getMinuteOptions(selectedMinute);

  return (
    <div className="mt-7 grid grid-cols-[1.4fr_0.8fr_0.8fr] gap-3">
      {/* Dates */}
      <div className="flex flex-col items-center">
        {dates.map((date) => {
          const selected =
            isSameDay(date, selectedDate);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onDateChange(date)}
              className={[
                "flex h-9 w-full items-center justify-center",
                "rounded-full text-sm transition",
                selected
                  ? "bg-[#1f2937] font-bold text-white"
                  : "text-gray-300 hover:text-gray-500",
              ].join(" ")}
            >
              {formatDateOption(
                date,
                selectedDate
              )}
            </button>
          );
        })}
      </div>

      {/* Hours */}
      <div className="flex flex-col items-center">
        {hours.map((hour) => {
          const selected =
            hour === selectedHour;

          return (
            <button
              key={hour}
              type="button"
              onClick={() => onHourChange(hour)}
              className={[
                "flex h-9 w-14 items-center justify-center",
                "rounded-full text-sm transition",
                selected
                  ? "bg-gray-100 font-bold text-gray-900"
                  : "text-gray-300 hover:text-gray-500",
              ].join(" ")}
            >
              {String(hour).padStart(2, "0")}
            </button>
          );
        })}
      </div>

      {/* Minutes */}
      <div className="flex flex-col items-center">
        {minutes.map((minute) => {
          const selected =
            minute === selectedMinute;

          return (
            <button
              key={minute}
              type="button"
              onClick={() =>
                onMinuteChange(minute)
              }
              className={[
                "flex h-9 w-14 items-center justify-center",
                "rounded-full text-sm transition",
                selected
                  ? "bg-gray-100 font-bold text-gray-900"
                  : "text-gray-300 hover:text-gray-500",
              ].join(" ")}
            >
              {String(minute).padStart(2, "0")}
            </button>
          );
        })}
      </div>
    </div>
  );
}