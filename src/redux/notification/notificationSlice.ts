import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// Only whether the panel is open: the notifications themselves are server data
// (useNotifications)
type NotificationState = {
  isOpen: boolean;
};

const initialState: NotificationState = {
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
  },
});

export const { toggleNotifications, closeNotifications } = notificationSlice.actions;

export const selectNotificationsOpen = (state: RootState) =>
  state.notification.isOpen;

export default notificationSlice.reducer;
