import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import type { StaffRole } from "@/types/admin";

// Steps of the admin booking workflow, in the order they must be completed
export const WORKFLOW_STEPS = ["confirm", "valet", "manager", "payment"] as const;
export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];

// Modals on the admin bookings page (/admin)
type AdminModalState = {
  // Read-only booking details
  detailsBookingId: string | null;
  // Workflow stepper (confirm, valet, manager, payment)
  workflowBookingId: string | null;
  // null = open on the first step that isn't done yet
  activeStep: WorkflowStep | null;
  // "Add valet / relationship manager" modal, opened from a workflow step
  addStaff: { role: StaffRole; name: string } | null;
};

const initialState: AdminModalState = {
  detailsBookingId: null,
  workflowBookingId: null,
  activeStep: null,
  addStaff: null,
};

const adminModalSlice = createSlice({
  name: "adminModal",
  initialState,
  reducers: {
    openBookingDetails: (state, action: PayloadAction<string>) => {
      state.detailsBookingId = action.payload;
    },
    closeBookingDetails: (state) => {
      state.detailsBookingId = null;
    },
    // Replaces the details modal so only one booking modal is open at a time
    openBookingWorkflow: (state, action: PayloadAction<string>) => {
      state.detailsBookingId = null;
      state.workflowBookingId = action.payload;
      state.activeStep = null;
    },
    setWorkflowStep: (state, action: PayloadAction<WorkflowStep>) => {
      state.activeStep = action.payload;
    },
    closeBookingWorkflow: () => initialState,
    // name pre-fills the form, e.g. with what the admin searched for
    openAddStaff: (state, action: PayloadAction<{ role: StaffRole; name?: string }>) => {
      state.addStaff = { role: action.payload.role, name: action.payload.name ?? "" };
    },
    closeAddStaff: (state) => {
      state.addStaff = null;
    },
  },
});

export const {
  openBookingDetails,
  closeBookingDetails,
  openBookingWorkflow,
  setWorkflowStep,
  closeBookingWorkflow,
  openAddStaff,
  closeAddStaff,
} = adminModalSlice.actions;

export const selectAdminModal = (state: RootState) => state.adminModal;

export default adminModalSlice.reducer;
