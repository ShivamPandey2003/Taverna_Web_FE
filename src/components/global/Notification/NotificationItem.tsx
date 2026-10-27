import { cn } from "@/libs/utils";
import type { Notification } from "@/types/notification";
import { NotificationIcon } from "./NotificationIcon";

interface NotificationItemProps {
  notification: Notification;
  // "9:12 AM", or with the date for older ones
  time: string;
  onRead: () => void;
}

export function NotificationItem({ notification, time, onRead }: NotificationItemProps) {
  return (
    <button
      data-test-id={`notification-item-${notification.id}`}
      type="button"
      onClick={onRead}
      className={cn(
        "relative flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-gray-100",
        notification.read ? "border border-gray-200 bg-white" : "bg-gray-100",
      )}
    >
      <NotificationIcon bookingStatus={notification.bookingStatus} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#111827]">{notification.title}</p>

        <p className="mt-0.5 text-sm leading-4.5 text-gray-500">{notification.message}</p>

        <p className="mt-1 text-xs text-gray-400">
          {notification.bookingId && <>#{notification.bookingId} · </>}
          {time}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#111827]" />
      )}
    </button>
  );
}
