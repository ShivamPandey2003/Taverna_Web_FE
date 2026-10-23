// One of the customer's in-app notifications (user/notifications)
export interface Notification {
  id: string;
  // The booking it's about
  bookingId: string | null;
  // The API's kind, e.g. "BOOKING_STATUS_UPDATED", "BOOKING_CREATED"
  type: string;
  title: string;
  message: string;
  // The booking's status code it reports, from the metadata, e.g. "VALET_ASSIGNED"
  bookingStatus: string | null;
  // ISO string
  createdAt: string;
  read: boolean;
}
