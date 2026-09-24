import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

// Steps of the admin booking workflow, in the order they must be completed
export const WORKFLOW_STEPS = ["confirm", "valet", "manager", "payment"] as const;
export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];

// Modals on the admin bookings page (/admin)
type AdminModalState = {
  selectedBookingId: string | null;
  // null = open on the first step that isn't done yet
  activeStep: WorkflowStep | null;
};

const initialState: AdminModalState = {
  selectedBookingId: null,
  activeStep: null,
};

const adminModalSlice = createSlice({
  name: "adminModal",
  initialState,
  reducers: {
    openBookingWorkflow: (state, action: PayloadAction<string>) => {
      state.selectedBookingId = action.payload;
      state.activeStep = null;
    },
    setWorkflowStep: (state, action: PayloadAction<WorkflowStep>) => {
      state.activeStep = action.payload;
    },
    closeBookingWorkflow: () => initialState,
  },
});

export const { openBookingWorkflow, setWorkflowStep, closeBookingWorkflow } =
  adminModalSlice.actions;

export const selectAdminModal = (state: RootState) => state.adminModal;

export default adminModalSlice.reducer;
