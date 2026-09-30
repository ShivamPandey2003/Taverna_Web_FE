export type NotificationType =
  | "valet"
  | "pickup"
  | "booking"
  | "offer"
  | "payment"
  | "plan"
  | "document";

export type NotificationSection =
  | "TODAY"
  | "YESTERDAY"
  | "EARLIER THIS WEEK";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  section: NotificationSection;
  read: boolean;
}
