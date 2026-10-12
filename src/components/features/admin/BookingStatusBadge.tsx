import { cn } from "@/libs/utils";
import { statusColors } from "@/libs/statusColors";
import type { BookingStatus } from "@/types/booking";

interface BookingStatusBadgeProps {
  // null for a status the app has no colour for: shown in grey
  status: BookingStatus | null;
  // The API's own name for the status, shown instead of the app's
  label?: string;
  // "md" is a little larger, for next to a page or drawer title
  size?: "sm" | "md";
}

export function BookingStatusBadge({ status, label, size = "sm" }: BookingStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full font-semibold",
        size === "md" ? "px-2.5 py-1 text-[13px]" : "px-2 py-0.5 text-[11px]",
        status ? statusColors[status].soft : "bg-gray-100 text-gray-600",
      )}
    >
      {label ?? status}
    </span>
  );
}
