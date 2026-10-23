import { cn } from "@/libs/utils";
import { statusColors } from "@/libs/statusColors";
import { statusStage } from "@/services/bookingApi";
import type { BookingStatus } from "@/types/booking";

interface BookingStatusBadgeProps {
  // null for a status the app has no colour for: shown in grey
  status: BookingStatus | null;
  // The API's own name for the status, shown instead of the app's
  label?: string;
  // The API's status code ("VALET_ARRIVED_AT_CUSTOMER", or the journey's
  // "valetArrivedAtCustomer"): picks the colour the same way the customer side
  // does (statusStage), so both show a status in the same colour
  code?: string | null;
  // "md" is a little larger, for next to a page or drawer title
  size?: "sm" | "md";
}

// "valetArrivedAtCustomer" -> "VALET_ARRIVED_AT_CUSTOMER"; codes already in
// capitals stay as they are
const toStatusCode = (code: string) => code.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();

export function BookingStatusBadge({ status, label, code, size = "sm" }: BookingStatusBadgeProps) {
  const stage = (code && statusStage(toStatusCode(code))) || status;

  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full font-semibold",
        size === "md" ? "px-2.5 py-1 text-[13px]" : "px-2 py-0.5 text-[11px]",
        stage ? statusColors[stage].soft : "bg-gray-100 text-gray-600",
      )}
    >
      {label ?? status}
    </span>
  );
}
