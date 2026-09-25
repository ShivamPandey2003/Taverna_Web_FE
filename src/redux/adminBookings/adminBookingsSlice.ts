import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type {
  BookingListParams,
  BookingSortField,
} from "@/types/admin";

// Query sent to the admin bookings API; any change here triggers a refetch
const initialState: BookingListParams = {
  page: 1,
  pageSize: 12,
  sortBy: "createdAt",
  sortOrder: "desc",
  search: "",
  status: "all",
  serviceId: "all",
};

const adminBookingsSlice = createSlice({
  name: "adminBookings",
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.page = 1;
    },
    // Clicking the active column flips the order; a new column starts descending
    toggleSort: (state, action: PayloadAction<BookingSortField>) => {
      if (state.sortBy === action.payload) {
        state.sortOrder = state.sortOrder === "asc" ? "desc" : "asc";
      } else {
        state.sortBy = action.payload;
        state.sortOrder = "desc";
      }
      state.page = 1;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1;
    },
    setStatusFilter: (state, action: PayloadAction<BookingListParams["status"]>) => {
      state.status = action.payload;
      state.page = 1;
    },
    setServiceFilter: (state, action: PayloadAction<BookingListParams["serviceId"]>) => {
      state.serviceId = action.payload;
      state.page = 1;
    },
    resetFilters: () => initialState,
  },
});

export const {
  setPage,
  setPageSize,
  toggleSort,
  setSearch,
  setStatusFilter,
  setServiceFilter,
  resetFilters,
} = adminBookingsSlice.actions;

export const selectBookingListParams = (state: RootState) => state.adminBookings;

export default adminBookingsSlice.reducer;
