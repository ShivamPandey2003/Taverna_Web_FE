import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { logout } from "@/redux/auth/authSlice";
import type { Booking, BookingStatus } from "@/types/booking";

type TrackingState = {
  activeBooking: Booking | null;
};

const initialState: TrackingState = {
  activeBooking: null,
};

const trackingSlice = createSlice({
  name: "tracking",
  initialState,
  reducers: {
    bookingCreated: (state, action: PayloadAction<Booking>) => {
      state.activeBooking = action.payload;
    },
    // Rebuilt from the API (e.g. after a reload). Unlike bookingCreated, other slices ignore it.
    activeBookingRestored: (state, action: PayloadAction<Booking>) => {
      state.activeBooking = action.payload;
    },
    setBookingStatus: (state, action: PayloadAction<BookingStatus>) => {
      if (state.activeBooking) {
        state.activeBooking.status = action.payload;
      }
    },
    clearActiveBooking: (state) => {
      state.activeBooking = null;
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
} = trackingSlice.actions;

export const selectActiveBooking = (state: RootState) =>
  state.tracking.activeBooking;

export default trackingSlice.reducer;
