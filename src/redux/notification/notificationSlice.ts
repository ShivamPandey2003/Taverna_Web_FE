import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { defaultNotifications } from "@/components/global/Notification/Notification.data";
import { bookingCreated } from "@/redux/tracking/trackingSlice";
import { services } from "@/components/features/booking/booking.data";
import type { Notification } from "@/types/notification";

type NotificationState = {
  items: Notification[];
  isOpen: boolean;
};

const initialState: NotificationState = {
  items: defaultNotifications,
  isOpen: false,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    toggleNotifications: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeNotifications: (state) => {
      state.isOpen = false;
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((item) => item.id === action.payload);
      if (item) item.read = true;
    },
    markAllAsRead: (state) => {
      state.items.forEach((item) => {
        item.read = true;
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(bookingCreated, (state, action) => {
      const booking = action.payload;
      const service = services.find((item) => item.id === booking.serviceId);

      state.items.unshift({
        id: booking.id,
        type: "booking",
        title: "Booking Received",
        description: `Booking #${booking.id} received for ${service?.title ?? "service"}`,
        time: new Date(booking.createdAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        section: "TODAY",
        read: false,
      });
    });
  },
});

export const { toggleNotifications, closeNotifications, markAsRead, markAllAsRead } =
  notificationSlice.actions;

export const selectNotifications = (state: RootState) => state.notification.items;

export const selectNotificationsOpen = (state: RootState) =>
  state.notification.isOpen;

export const selectUnreadCount = (state: RootState) =>
  state.notification.items.filter((item) => !item.read).length;

export default notificationSlice.reducer;
