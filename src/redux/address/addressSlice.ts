import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { logout } from "@/redux/auth/authSlice";
import type { Address } from "@/types/address";

type AddressState = {
  addresses: Address[];
};

const initialState: AddressState = {
  addresses: [],
};

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    // The saved addresses come from the API (see useSyncAddresses); adding,
    // editing and deleting go through the mutation hooks in addressQueries
    setAddresses: (state, action: PayloadAction<Address[]>) => {
      state.addresses = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Each account starts with its own empty data
    builder.addCase(logout, () => initialState);
  },
});

export const { setAddresses } = addressSlice.actions;

export const selectAddresses = (state: RootState) => state.address.addresses;

export const selectAddressById = (state: RootState, id: string | null) =>
  state.address.addresses.find((address) => address.id === id) ?? null;

export const selectDefaultAddress = (state: RootState) =>
  state.address.addresses.find((address) => address.isDefault) ??
  state.address.addresses[0] ??
  null;

export default addressSlice.reducer;
