import { cn } from "@/libs/utils";
import { statusColors } from "@/libs/statusColors";
import type { BookingStatus } from "@/types/booking";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  // "md" is a little larger, for next to a page or drawer title
  size?: "sm" | "md";
}

export function BookingStatusBadge({ status, size = "sm" }: BookingStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full font-semibold",
        size === "md" ? "px-2.5 py-1 text-[13px]" : "px-2 py-0.5 text-[11px]",
        statusColors[status].soft,
      )}
    >
      {status}
    </span>
  );
}
