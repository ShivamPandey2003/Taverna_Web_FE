import { AngleRight } from "reicon-react";
import { cn } from "@/libs/utils";
import type { StatusTone } from "./serviceStatus";

interface BookingStatusProps {
  dealership: string;
  time: string;
  status: string;
  // Orange while waiting for confirmation, green after
  tone: StatusTone;
  // Demo only (mock API): makes the status pill move the booking to its next status
  onAdvance?: () => void;
  advancing?: boolean;
}

export function BookingStatus({
  dealership,
  time,
  status,
  tone,
  onAdvance,
  advancing = false,
}: BookingStatusProps) {
  const pillClass =
    "mt-3 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold backdrop-blur-sm";

  return (
    <section
      className={cn(
        "flex min-h-[166px] flex-col items-center justify-center rounded-2xl px-6 text-center text-white transition-colors",
        tone === "pending" ? "bg-status-pending" : "bg-status-active",
      )}
    >
      <p className="text-sm font-medium">
        {dealership}
      </p>

      <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-[26px]">
        Service booked at {time}
      </h1>

      {onAdvance ? (
        <button
          type="button"
          onClick={onAdvance}
          disabled={advancing}
          title="Demo: move to the next status"
          className={cn(
            pillClass,
            "flex items-center gap-1.5 transition hover:bg-white/25 disabled:cursor-wait disabled:opacity-70",
          )}
        >
          {advancing ? "Updating..." : status}
          <AngleRight size={15} strokeWidth={2.5} />
        </button>
      ) : (
        <div className={pillClass}>{status}</div>
      )}
    </section>
  );
}
