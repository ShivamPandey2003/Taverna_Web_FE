import type { NotificationSection } from "@/types/notification";
import { NotificationItem } from "./NotificationItem";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { markAsRead, selectNotifications } from "@/redux/notification/notificationSlice";

const sections: NotificationSection[] = [
  "TODAY",
  "YESTERDAY",
  "EARLIER THIS WEEK",
];

export function NotificationList() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const sectionNotifications =
          notifications.filter(
            (notification) =>
              notification.section === section
          );

        if (!sectionNotifications.length) {
          return null;
        }

        return (
          <section key={section}>
            <p className="mb-2 text-xs font-semibold tracking-wide text-gray-400">
              {section}
            </p>

            <div className="space-y-2">
              {sectionNotifications.map(
                (notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={() =>
                      dispatch(markAsRead(notification.id))
                    }
                  />
                )
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
