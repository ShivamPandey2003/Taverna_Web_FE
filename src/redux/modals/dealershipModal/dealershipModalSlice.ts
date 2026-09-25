import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// Modals on the admin dealerships page (/admin/dealerships)
type DealershipModalState = {
  addDealershipOpen: boolean;
};

const initialState: DealershipModalState = {
  addDealershipOpen: false,
};

const dealershipModalSlice = createSlice({
  name: "dealershipModal",
  initialState,
  reducers: {
    openAddDealership: (state) => {
      state.addDealershipOpen = true;
    },
    closeAddDealership: (state) => {
      state.addDealershipOpen = false;
    },
  },
});

export const { openAddDealership, closeAddDealership } = dealershipModalSlice.actions;

export const selectDealershipModal = (state: RootState) => state.dealershipModal;

export default dealershipModalSlice.reducer;
