import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// Modals on the Book Service page (/dashboard/book-service)
type BookServiceModalState = {
  selectVehicleOpen: boolean;
};

const initialState: BookServiceModalState = {
  selectVehicleOpen: false,
};

const bookServiceModalSlice = createSlice({
  name: "bookServiceModal",
  initialState,
  reducers: {
    openSelectVehicle: (state) => {
      state.selectVehicleOpen = true;
    },
    closeSelectVehicle: (state) => {
      state.selectVehicleOpen = false;
    },
  },
});

export const { openSelectVehicle, closeSelectVehicle } =
  bookServiceModalSlice.actions;

export const selectBookServiceModal = (state: RootState) =>
  state.bookServiceModal;

export default bookServiceModalSlice.reducer;
