import { useEffect, useRef } from "react";
import {
  Bell,
} from "reicon-react";
import { NotificationList } from "./NotificationList";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeNotifications,
  markAllAsRead,
  selectNotificationsOpen,
  selectUnreadCount,
  toggleNotifications,
} from "@/redux/notification/notificationSlice";

export function NotificationDropdown() {
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectNotificationsOpen);
  const unreadCount = useAppSelector(selectUnreadCount);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on a click outside the bell + panel, or on Escape
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        dispatch(closeNotifications());
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        dispatch(closeNotifications());
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch, open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Notification button */}
      <button
        type="button"
        onClick={() => dispatch(toggleNotifications())}
        className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell
          size={20}
          strokeWidth={1.8}
          className="text-[#111827]"
        />

        {/* Unread indicator */}
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/10 md:hidden"
            onClick={() => dispatch(closeNotifications())}
          />

          <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[390px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-lg font-bold text-[#111827]">
                Notifications
              </h2>

              <button
                type="button"
                onClick={() => dispatch(markAllAsRead())}
                disabled={unreadCount === 0}
                className="text-sm font-medium text-emerald-600 transition hover:text-emerald-700 disabled:cursor-default disabled:opacity-40"
              >
                Mark all read
              </button>
            </div>

            {/* Notifications */}
            <div className="max-h-112.5 overflow-y-auto px-4 pb-4">
              <NotificationList />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
