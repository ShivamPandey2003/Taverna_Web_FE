import { cn } from "@/libs/utils";
import { BookingStatus } from "@/types/booking";

const styles: Partial<Record<BookingStatus, string>> = {
  [BookingStatus.IN_QUEUE]: "bg-amber-50 text-amber-700",
  [BookingStatus.BOOKED]: "bg-blue-50 text-blue-700",
  [BookingStatus.VALET_ASSIGNED]: "bg-emerald-50 text-emerald-700",
  [BookingStatus.SERVICE_COMPLETE]: "bg-gray-900 text-white",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
        styles[status] ?? "bg-gray-100 text-gray-700",
      )}
    >
      {status}
    </span>
  );
}
