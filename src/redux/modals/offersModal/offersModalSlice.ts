import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type { Offer } from "@/types/offer";

// Modals on the admin offers page (/admin/offers)
type OffersModalState = {
  // The bulk upload (CSV) modal
  uploadOpen: boolean;
  // Offer whose details are open (a copy of the table row)
  viewing: Offer | null;
  // Offer in the edit form (a copy of the table row)
  editing: Offer | null;
  // Offer waiting for delete confirmation
  deleting: Offer | null;
};

const initialState: OffersModalState = {
  uploadOpen: false,
  viewing: null,
  editing: null,
  deleting: null,
};

const offersModalSlice = createSlice({
  name: "offersModal",
  initialState,
  reducers: {
    openOfferUpload: (state) => {
      state.uploadOpen = true;
    },
    closeOfferUpload: (state) => {
      state.uploadOpen = false;
    },
    openOfferDetails: (state, action: PayloadAction<Offer>) => {
      state.viewing = action.payload;
    },
    closeOfferDetails: (state) => {
      state.viewing = null;
    },
    // Also from the details modal, which the form then replaces
    openEditOffer: (state, action: PayloadAction<Offer>) => {
      state.editing = action.payload;
      state.viewing = null;
    },
    closeEditOffer: (state) => {
      state.editing = null;
    },
    openDeleteOffer: (state, action: PayloadAction<Offer>) => {
      state.deleting = action.payload;
      state.viewing = null;
    },
    closeDeleteOffer: (state) => {
      state.deleting = null;
    },
  },
});

export const {
  openOfferUpload,
  closeOfferUpload,
  openOfferDetails,
  closeOfferDetails,
  openEditOffer,
  closeEditOffer,
  openDeleteOffer,
  closeDeleteOffer,
} = offersModalSlice.actions;

export const selectOffersModal = (state: RootState) => state.offersModal;

export default offersModalSlice.reducer;
