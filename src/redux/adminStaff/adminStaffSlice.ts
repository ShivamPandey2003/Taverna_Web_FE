import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type {
  StaffAvailability,
  StaffListParams,
  StaffRole,
  StaffSortField,
} from "@/types/admin";

// Query sent to the staff list APIs, one per role; any change here triggers a refetch
const initialParams: StaffListParams = {
  page: 1,
  pageSize: 12,
  sortBy: "name",
  sortOrder: "asc",
  search: "",
  availability: "all",
};

type AdminStaffState = Record<StaffRole, StaffListParams>;

const initialState: AdminStaffState = {
  valet: initialParams,
  manager: initialParams,
};

type RolePayload<T> = PayloadAction<{ role: StaffRole; value: T }>;

const adminStaffSlice = createSlice({
  name: "adminStaff",
  initialState,
  reducers: {
    setStaffPage: (state, action: RolePayload<number>) => {
      state[action.payload.role].page = action.payload.value;
    },
    setStaffPageSize: (state, action: RolePayload<number>) => {
      const params = state[action.payload.role];
      params.pageSize = action.payload.value;
      params.page = 1;
    },
    // Clicking the active column flips the order; a new column starts ascending
    toggleStaffSort: (state, action: RolePayload<StaffSortField>) => {
      const params = state[action.payload.role];
      if (params.sortBy === action.payload.value) {
        params.sortOrder = params.sortOrder === "asc" ? "desc" : "asc";
      } else {
        params.sortBy = action.payload.value;
        params.sortOrder = "asc";
      }
      params.page = 1;
    },
    setStaffSearch: (state, action: RolePayload<string>) => {
      const params = state[action.payload.role];
      params.search = action.payload.value;
      params.page = 1;
    },
    setStaffAvailability: (state, action: RolePayload<StaffAvailability>) => {
      const params = state[action.payload.role];
      params.availability = action.payload.value;
      params.page = 1;
    },
    resetStaffFilters: (state, action: PayloadAction<StaffRole>) => {
      state[action.payload] = initialParams;
    },
  },
});

export const {
  setStaffPage,
  setStaffPageSize,
  toggleStaffSort,
  setStaffSearch,
  setStaffAvailability,
  resetStaffFilters,
} = adminStaffSlice.actions;

export const selectStaffListParams = (state: RootState, role: StaffRole) =>
  state.adminStaff[role];

export default adminStaffSlice.reducer;
