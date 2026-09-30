import type { Notification } from "@/types/notification";
import { NotificationIcon } from "./NotificationIcon";

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
}

export function NotificationItem({
  notification,
  onRead,
}: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={onRead}
      className={[
        "relative flex w-full gap-3 rounded-xl p-3 text-left",
        "transition hover:bg-gray-100",
        notification.read
          ? "border border-gray-200 bg-white"
          : "bg-gray-100",
      ].join(" ")}
    >
      {/* Icon */}
      <NotificationIcon
        type={notification.type}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#111827]">
          {notification.title}
        </p>

        <p className="mt-0.5 text-sm leading-[18px] text-gray-500">
          {notification.description}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {notification.time}
        </p>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#111827]" />
      )}
    </button>
  );
}