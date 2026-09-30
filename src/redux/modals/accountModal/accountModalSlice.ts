import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { deleteAddress } from "@/redux/address/addressSlice";

// Modals on the Account page (/dashboard/account)
type AccountModalState = {
  addressModalOpen: boolean;
  // Address being edited; null while adding a new one
  editingAddressId: string | null;
};

const initialState: AccountModalState = {
  addressModalOpen: false,
  editingAddressId: null,
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
  },
  extraReducers: (builder) => {
    builder.addCase(deleteAddress, (state, action) => {
      if (state.editingAddressId === action.payload) {
        state.addressModalOpen = false;
        state.editingAddressId = null;
      }
    });
  },
});

export const { openAddAddress, openEditAddress, closeAddressModal } =
  accountModalSlice.actions;

export const selectAccountModal = (state: RootState) => state.accountModal;

export default accountModalSlice.reducer;
