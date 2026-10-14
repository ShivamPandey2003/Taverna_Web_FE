import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type { Offer } from "@/types/offer";

// Modals on the customer's Specials page
type SpecialsModalState = {
  // Offer whose details are open (a copy of the card)
  viewing: Offer | null;
};

const initialState: SpecialsModalState = {
  viewing: null,
};

const specialsModalSlice = createSlice({
  name: "specialsModal",
  initialState,
  reducers: {
    openSpecialOffer: (state, action: PayloadAction<Offer>) => {
      state.viewing = action.payload;
    },
    closeSpecialOffer: (state) => {
      state.viewing = null;
    },
  },
});

export const { openSpecialOffer, closeSpecialOffer } = specialsModalSlice.actions;

export const selectSpecialsModal = (state: RootState) => state.specialsModal;

export default specialsModalSlice.reducer;
