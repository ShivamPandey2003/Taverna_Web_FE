import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { logout } from "@/redux/auth/authSlice";
import type { CustomerOfferParams } from "@/types/offer";

// Cards per page on the Specials page (the API allows up to 100)
export const SPECIALS_PAGE_SIZE = 9;

// What the Specials page asks GET offers for; any change refetches
const initialState: CustomerOfferParams = {
  page: 1,
  pageSize: SPECIALS_PAGE_SIZE,
  brandName: "",
  model: "",
  offerType: "all",
};

const specialsSlice = createSlice({
  name: "specials",
  initialState,
  reducers: {
    setSpecialsPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    // A model the customer owns, or both empty for every offer
    setSpecialsVehicle: (state, action: PayloadAction<{ brandName: string; model: string }>) => {
      state.brandName = action.payload.brandName;
      state.model = action.payload.model;
      state.page = 1;
    },
    setSpecialsOfferType: (state, action: PayloadAction<string>) => {
      state.offerType = action.payload;
      state.page = 1;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const { setSpecialsPage, setSpecialsVehicle, setSpecialsOfferType } =
  specialsSlice.actions;

export const selectSpecialsParams = (state: RootState) => state.specials;

export default specialsSlice.reducer;
