import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { logout } from "@/redux/auth/authSlice";
import type { Booking } from "@/types/booking";

type TrackingState = {
  // The customer's bookings being tracked, newest first: one per vehicle at most
  // while it's unfinished. Each is a snapshot of what was booked: where it stands
  // comes from the API (useActiveServices).
  activeBookings: Booking[];
};

const initialState: TrackingState = {
  activeBookings: [],
};

const trackingSlice = createSlice({
  name: "tracking",
  initialState,
  reducers: {
    bookingCreated: (state, action: PayloadAction<Booking>) => {
      state.activeBookings = [
        action.payload,
        ...state.activeBookings.filter((booking) => booking.id !== action.payload.id),
      ];
    },
    // Rebuilt from the API (e.g. after a reload). Unlike bookingCreated, other slices
    // ignore it. Bookings already tracked are left alone.
    activeBookingsRestored: (state, action: PayloadAction<Booking[]>) => {
      const known = new Set(state.activeBookings.map((booking) => booking.id));
      state.activeBookings.push(...action.payload.filter((booking) => !known.has(booking.id)));
    },
    // Puts the right vehicle on tracked bookings the API ties to another one (by VIN)
    bookingVehiclesCorrected: (
      state,
      action: PayloadAction<{ id: string; vehicle: Booking["vehicle"] }[]>,
    ) => {
      action.payload.forEach(({ id, vehicle }) => {
        const booking = state.activeBookings.find((item) => item.id === id);
        if (booking) booking.vehicle = vehicle;
      });
    },
    // A cancelled booking is gone for good
    clearActiveBooking: (state, action: PayloadAction<string>) => {
      state.activeBookings = state.activeBookings.filter(
        (booking) => booking.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    // Each account starts with its own empty data
    builder.addCase(logout, () => initialState);
  },
});

export const {
  bookingCreated,
  activeBookingsRestored,
  bookingVehiclesCorrected,
  clearActiveBooking,
} = trackingSlice.actions;

export const selectActiveBookings = (state: RootState) => state.tracking.activeBookings;

export default trackingSlice.reducer;
