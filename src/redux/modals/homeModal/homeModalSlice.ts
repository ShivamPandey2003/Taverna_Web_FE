import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// Modals on the public landing page (/)
type HomeModalState = {
  authModalOpen: boolean;
};

const initialState: HomeModalState = {
  authModalOpen: false,
};

const homeModalSlice = createSlice({
  name: "homeModal",
  initialState,
  reducers: {
    openAuthModal: (state) => {
      state.authModalOpen = true;
    },
    closeAuthModal: (state) => {
      state.authModalOpen = false;
    },
  },
});

export const { openAuthModal, closeAuthModal } = homeModalSlice.actions;

export const selectHomeModal = (state: RootState) => state.homeModal;

export default homeModalSlice.reducer;
