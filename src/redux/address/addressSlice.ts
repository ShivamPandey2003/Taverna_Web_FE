import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
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
    addAddress: {
      reducer: (state, action: PayloadAction<Address>) => {
        // The first saved address becomes the default one
        const address = {
          ...action.payload,
          isDefault: state.addresses.length === 0,
        };
        state.addresses.unshift(address);
      },
      prepare: (address: Omit<Address, "id" | "isDefault">) => ({
        payload: { ...address, id: nanoid(), isDefault: false },
      }),
    },
    editAddress: (state, action: PayloadAction<Address>) => {
      state.addresses = state.addresses.map((item) =>
        item.id === action.payload.id ? action.payload : item,
      );
    },
    deleteAddress: (state, action: PayloadAction<string>) => {
      const removed = state.addresses.find((item) => item.id === action.payload);
      state.addresses = state.addresses.filter(
        (item) => item.id !== action.payload,
      );
      // Keep one default address while any address remains
      if (removed?.isDefault && state.addresses.length > 0) {
        state.addresses[0].isDefault = true;
      }
    },
    setDefaultAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.map((item) => ({
        ...item,
        isDefault: item.id === action.payload,
      }));
    },
  },
  extraReducers: (builder) => {
    // Each account starts with its own empty data
    builder.addCase(logout, () => initialState);
  },
});

export const { addAddress, editAddress, deleteAddress, setDefaultAddress } =
  addressSlice.actions;

export const selectAddresses = (state: RootState) => state.address.addresses;

export const selectAddressById = (state: RootState, id: string | null) =>
  state.address.addresses.find((address) => address.id === id) ?? null;

export const selectDefaultAddress = (state: RootState) =>
  state.address.addresses.find((address) => address.isDefault) ??
  state.address.addresses[0] ??
  null;

export default addressSlice.reducer;
