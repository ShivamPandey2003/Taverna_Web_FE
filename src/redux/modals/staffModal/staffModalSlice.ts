import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type { StaffMember } from "@/types/admin";

// Modals on the staff pages (/admin/valets, /admin/relationship-managers)
type StaffModalState = {
  formOpen: boolean;
  // Member being edited (a copy of the table row); null while adding
  editing: StaffMember | null;
  // Member waiting for delete confirmation
  deleting: StaffMember | null;
};

const initialState: StaffModalState = {
  formOpen: false,
  editing: null,
  deleting: null,
};

const staffModalSlice = createSlice({
  name: "staffModal",
  initialState,
  reducers: {
    openAddStaffMember: (state) => {
      state.formOpen = true;
      state.editing = null;
    },
    openEditStaffMember: (state, action: PayloadAction<StaffMember>) => {
      state.formOpen = true;
      state.editing = action.payload;
    },
    closeStaffForm: (state) => {
      state.formOpen = false;
      state.editing = null;
    },
    openDeleteStaffMember: (state, action: PayloadAction<StaffMember>) => {
      state.deleting = action.payload;
    },
    closeDeleteStaffMember: (state) => {
      state.deleting = null;
    },
    // Leaving a staff page closes its modals
    resetStaffModals: () => initialState,
  },
});

export const {
  openAddStaffMember,
  openEditStaffMember,
  closeStaffForm,
  openDeleteStaffMember,
  closeDeleteStaffMember,
  resetStaffModals,
} = staffModalSlice.actions;

export const selectStaffModal = (state: RootState) => state.staffModal;

export default staffModalSlice.reducer;
