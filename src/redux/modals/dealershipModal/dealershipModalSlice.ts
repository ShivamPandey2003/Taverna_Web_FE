import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type { Dealership } from "@/types/dealership";

// Modals on the admin dealerships page (/admin/dealerships)
type DealershipModalState = {
  formOpen: boolean;
  // Dealership being edited (a copy of the card); null while adding
  editing: Dealership | null;
  // Dealership waiting for delete confirmation
  deleting: Dealership | null;
};

const initialState: DealershipModalState = {
  formOpen: false,
  editing: null,
  deleting: null,
};

const dealershipModalSlice = createSlice({
  name: "dealershipModal",
  initialState,
  reducers: {
    openAddDealership: (state) => {
      state.formOpen = true;
      state.editing = null;
    },
    openEditDealership: (state, action: PayloadAction<Dealership>) => {
      state.formOpen = true;
      state.editing = action.payload;
    },
    closeDealershipForm: (state) => {
      state.formOpen = false;
      state.editing = null;
    },
    openDeleteDealership: (state, action: PayloadAction<Dealership>) => {
      state.deleting = action.payload;
    },
    closeDeleteDealership: (state) => {
      state.deleting = null;
    },
  },
});

export const {
  openAddDealership,
  openEditDealership,
  closeDealershipForm,
  openDeleteDealership,
  closeDeleteDealership,
} = dealershipModalSlice.actions;

export const selectDealershipModal = (state: RootState) => state.dealershipModal;

export default dealershipModalSlice.reducer;
