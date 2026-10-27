import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// How often the admin bookings list loads again by itself, in seconds; 0 = stopped
export const BOOKINGS_REFRESH_OPTIONS = [5, 10, 15, 20, 0] as const;
export type BookingsRefreshSeconds = (typeof BOOKINGS_REFRESH_OPTIONS)[number];

// Kept per browser, so a reload keeps the admin's choice
const STORAGE_KEY = "taverna_bookings_refresh";

function storedSeconds(): BookingsRefreshSeconds {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));
    const option = BOOKINGS_REFRESH_OPTIONS.find((seconds) => seconds === value);
    return localStorage.getItem(STORAGE_KEY) !== null && option !== undefined ? option : 5;
  } catch {
    return 5;
  }
}

export function saveBookingsRefresh(seconds: BookingsRefreshSeconds) {
  try {
    localStorage.setItem(STORAGE_KEY, String(seconds));
  } catch {
    // Private window or blocked storage: the choice lasts until the reload
  }
}

const adminRefreshSlice = createSlice({
  name: "adminRefresh",
  initialState: { bookingsSeconds: storedSeconds() },
  reducers: {
    setBookingsRefresh: (state, action: PayloadAction<BookingsRefreshSeconds>) => {
      state.bookingsSeconds = action.payload;
    },
  },
});

export const { setBookingsRefresh } = adminRefreshSlice.actions;

export const selectBookingsRefresh = (state: RootState) => state.adminRefresh.bookingsSeconds;

export default adminRefreshSlice.reducer;
