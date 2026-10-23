import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// Search on the admin dealerships page; applied in the browser (useAdminDealerships)
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
