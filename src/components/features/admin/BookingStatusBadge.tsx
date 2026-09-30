import { cn } from "@/libs/utils";
import { statusColors } from "@/libs/statusColors";
import type { BookingStatus } from "@/types/booking";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        statusColors[status].soft,
      )}
    >
      {status}
    </span>
  );
}
