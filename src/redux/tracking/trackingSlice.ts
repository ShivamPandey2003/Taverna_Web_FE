import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { logout } from "@/redux/auth/authSlice";
import type { Booking, BookingStatus } from "@/types/booking";

type TrackingState = {
  activeBooking: Booking | null;
  // Status the service toast was closed on; it shows again once the status changes
  dismissedStatus: BookingStatus | null;
  // The sidebar card stays up after the service completes until the customer closes it
  completedCardDismissed: boolean;
};

const initialState: TrackingState = {
  activeBooking: null,
  dismissedStatus: null,
  completedCardDismissed: false,
};

const trackingSlice = createSlice({
  name: "tracking",
  initialState,
  reducers: {
    bookingCreated: (state, action: PayloadAction<Booking>) => {
      state.activeBooking = action.payload;
      state.dismissedStatus = null;
      state.completedCardDismissed = false;
    },
    // Rebuilt from the API (e.g. after a reload). Unlike bookingCreated, other slices ignore it.
    activeBookingRestored: (state, action: PayloadAction<Booking>) => {
      state.activeBooking = action.payload;
      state.dismissedStatus = null;
      state.completedCardDismissed = false;
    },
    setBookingStatus: (state, action: PayloadAction<BookingStatus>) => {
      if (state.activeBooking) {
        state.activeBooking.status = action.payload;
      }
    },
    clearActiveBooking: (state) => {
      state.activeBooking = null;
      state.dismissedStatus = null;
      state.completedCardDismissed = false;
    },
    statusToastDismissed: (state, action: PayloadAction<BookingStatus>) => {
      state.dismissedStatus = action.payload;
    },
    completedCardClosed: (state) => {
      state.completedCardDismissed = true;
    },
  },
  extraReducers: (builder) => {
    // Each account starts with its own empty data
    builder.addCase(logout, () => initialState);
  },
});

export const {
  bookingCreated,
  activeBookingRestored,
  setBookingStatus,
  clearActiveBooking,
  statusToastDismissed,
  completedCardClosed,
} = trackingSlice.actions;

export const selectActiveBooking = (state: RootState) =>
  state.tracking.activeBooking;

export const selectDismissedStatus = (state: RootState) =>
  state.tracking.dismissedStatus;

export const selectCompletedCardDismissed = (state: RootState) =>
  state.tracking.completedCardDismissed;

export default trackingSlice.reducer;
