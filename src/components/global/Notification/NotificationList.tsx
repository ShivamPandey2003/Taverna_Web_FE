import { NotificationItem } from "./NotificationItem";
import {
  useMarkNotificationRead,
  useNotifications,
} from "@/services/queries/notificationQueries";
import type { Notification } from "@/types/notification";

const DAY_MS = 24 * 60 * 60 * 1000;

const SECTIONS = ["TODAY", "YESTERDAY", "EARLIER THIS WEEK", "OLDER"] as const;
type Section = (typeof SECTIONS)[number];

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

// Which day group a notification falls in, by the device's calendar
function sectionOf(createdAt: string, today: number): Section {
  const daysAgo = Math.round((today - startOfDay(new Date(createdAt))) / DAY_MS);
  if (daysAgo <= 0) return "TODAY";
  if (daysAgo === 1) return "YESTERDAY";
  if (daysAgo < 7) return "EARLIER THIS WEEK";
  return "OLDER";
}

// "9:12 AM" today and yesterday, "Mon, Oct 12, 9:12 AM" before that
function timeOf(createdAt: string, section: Section) {
  const date = new Date(createdAt);
  return section === "TODAY" || section === "YESTERDAY"
    ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

export function NotificationList() {
  const { data: notifications, isPending, isError, refetch, isFetching } = useNotifications();
  const markRead = useMarkNotificationRead();

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-18 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500">We couldn't load your notifications.</p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-3 text-sm font-semibold text-gray-900 underline underline-offset-4 disabled:opacity-40"
        >
          {isFetching ? "Loading..." : "Try Again"}
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">No notifications yet.</p>;
  }

  const today = startOfDay(new Date());
  const grouped = new Map<Section, Notification[]>();
  for (const notification of notifications) {
    const section = sectionOf(notification.createdAt, today);
    grouped.set(section, [...(grouped.get(section) ?? []), notification]);
  }

  return (
    <div className="space-y-5">
      {SECTIONS.filter((section) => grouped.has(section)).map((section) => (
        <section key={section}>
          <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400">{section}</p>

          <div className="space-y-2">
            {grouped.get(section)!.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                time={timeOf(notification.createdAt, section)}
                onRead={() => {
                  if (!notification.read) markRead.mutate(notification.id);
                }}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
