import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// Query for the admin dealerships list; see DEALERSHIP_SEARCH_VIA_API in adminQueries
type AdminDealershipsState = {
  search: string;
};

const initialState: AdminDealershipsState = {
  search: "",
};

const adminDealershipsSlice = createSlice({
  name: "adminDealerships",
  initialState,
  reducers: {
    setDealershipSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
  },
});

export const { setDealershipSearch } = adminDealershipsSlice.actions;

export const selectDealershipSearch = (state: RootState) => state.adminDealerships.search;

export default adminDealershipsSlice.reducer;
