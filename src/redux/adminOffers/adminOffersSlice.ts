import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { ADMIN_PAGE_SIZE } from "@/types/admin";
import type { OfferListParams } from "@/types/offer";

// Query sent to offers/list; any change here triggers a refetch
const initialState: OfferListParams = {
  page: 1,
  pageSize: ADMIN_PAGE_SIZE,
  search: "",
  condition: "all",
  offerType: "all",
};

const adminOffersSlice = createSlice({
  name: "adminOffers",
  initialState,
  reducers: {
    setOffersPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setOffersSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
      state.page = 1;
    },
    setOfferConditionFilter: (state, action: PayloadAction<string>) => {
      state.condition = action.payload;
      state.page = 1;
    },
    setOfferTypeFilter: (state, action: PayloadAction<string>) => {
      state.offerType = action.payload;
      state.page = 1;
    },
    resetOfferFilters: () => initialState,
  },
});

export const {
  setOffersPage,
  setOffersSearch,
  setOfferConditionFilter,
  setOfferTypeFilter,
  resetOfferFilters,
} = adminOffersSlice.actions;

export const selectOfferListParams = (state: RootState) => state.adminOffers;

export default adminOffersSlice.reducer;
