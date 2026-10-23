import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// Modals on the Account page (/dashboard/account)
type AccountModalState = {
  addressModalOpen: boolean;
  // Address being edited; null while adding a new one
  editingAddressId: string | null;
  // Address awaiting delete confirmation
  deletingAddressId: string | null;
};

const initialState: AccountModalState = {
  addressModalOpen: false,
  editingAddressId: null,
  deletingAddressId: null,
};

const accountModalSlice = createSlice({
  name: "accountModal",
  initialState,
  reducers: {
    openAddAddress: (state) => {
      state.addressModalOpen = true;
      state.editingAddressId = null;
    },
    openEditAddress: (state, action: PayloadAction<string>) => {
      state.addressModalOpen = true;
      state.editingAddressId = action.payload;
    },
    closeAddressModal: (state) => {
      state.addressModalOpen = false;
      state.editingAddressId = null;
    },
    openDeleteAddress: (state, action: PayloadAction<string>) => {
      state.deletingAddressId = action.payload;
    },
    closeDeleteAddress: (state) => {
      state.deletingAddressId = null;
    },
  },
});

export const {
  openAddAddress,
  openEditAddress,
  closeAddressModal,
  openDeleteAddress,
  closeDeleteAddress,
} = accountModalSlice.actions;

export const selectAccountModal = (state: RootState) => state.accountModal;

export default accountModalSlice.reducer;
