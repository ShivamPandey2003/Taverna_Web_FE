import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// Modals on the booking review page (/dashboard/book-service/review).
// Only one of them is open at a time.
export type ReviewModal =
  | "vehicle"
  | "location"
  | "addAddress"
  | "dealership"
  | "schedule";

type ReviewModalState = {
  activeModal: ReviewModal | null;
};

const initialState: ReviewModalState = {
  activeModal: null,
};

const reviewModalSlice = createSlice({
  name: "reviewModal",
  initialState,
  reducers: {
    openReviewModal: (state, action: PayloadAction<ReviewModal>) => {
      state.activeModal = action.payload;
    },
    closeReviewModal: (state) => {
      state.activeModal = null;
    },
  },
});

export const { openReviewModal, closeReviewModal } = reviewModalSlice.actions;

export const selectReviewModal = (state: RootState) =>
  state.reviewModal.activeModal;

export default reviewModalSlice.reducer;
