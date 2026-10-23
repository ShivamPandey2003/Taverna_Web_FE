import { Bell } from "reicon-react";
import { statusIcons } from "@/components/features/tracking/serviceStatus";
import { statusColors } from "@/libs/statusColors";
import { cn } from "@/libs/utils";
import { statusStage } from "@/services/bookingApi";

// The icon and colour of the booking stage the notification reports; a bell for
// anything else
export function NotificationIcon({ bookingStatus }: { bookingStatus: string | null }) {
  const stage = bookingStatus ? statusStage(bookingStatus) : null;
  const Icon = stage ? statusIcons[stage] : Bell;

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
        stage ? statusColors[stage].soft : "bg-gray-100 text-gray-700",
      )}
    >
      <Icon size={18} strokeWidth={2} />
    </div>
  );
}
