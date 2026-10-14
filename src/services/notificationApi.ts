import { request, toQueryString } from "./apiClient";
import type { Notification } from "@/types/notification";

// A notification as user/notifications sends it
interface NotificationResponse {
  notificationId: string;
  userId: string;
  bmsId: string | null;
  type: string;
  title: string;
  message: string;
  channel: string;
  deliveryStatus: string;
  // JSON text, e.g. {"bookingStatus": "VALET_ASSIGNED", "statusAt": "…", …}
  metadata: string | null;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

// The booking status the metadata names, if it can be read
function metadataStatus(metadata: string | null): string | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as { bookingStatus?: unknown };
    return typeof parsed.bookingStatus === "string" ? parsed.bookingStatus : null;
  } catch {
    return null;
  }
}

function toNotification(notification: NotificationResponse): Notification {
  return {
    id: notification.notificationId,
    bookingId: notification.bmsId,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    bookingStatus: metadataStatus(notification.metadata),
    createdAt: notification.sentAt ?? notification.createdAt,
    read: notification.readAt !== null,
  };
}

export const notificationApi = {
  // Newest first
  list: async ({ unreadOnly, limit }: { unreadOnly?: boolean; limit?: number } = {}) =>
    (
      await request<NotificationResponse[]>(
        "get",
        `user/notifications${toQueryString({
          ...(unreadOnly !== undefined && { unreadOnly: String(unreadOnly) }),
          ...(limit !== undefined && { limit }),
        })}`,
      )
    ).map(toNotification),

  markRead: async (id: string) =>
    toNotification(
      await request<NotificationResponse>("post", `user/notifications/${id}/read`),
    ),

  markAllRead: () =>
    request<{ updatedCount: number }>("post", "user/notifications/read-all"),
};
