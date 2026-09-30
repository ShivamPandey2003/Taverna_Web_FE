import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { addVehicle, removeVehicle } from "@/redux/vehicle/vehicleSlice";
import type { Vehicle } from "@/types/vehicle";

// Modals on the dashboard vehicle list (/dashboard)
type DashboardModalState = {
  registerVehicleOpen: boolean;
  // Vehicle returned by the VIN lookup, waiting for the user to confirm "Add Vehicle"
  verifiedVehicle: Omit<Vehicle, "id"> | null;
  // Saved vehicle whose details modal is open
  viewVehicleId: string | null;
};

const initialState: DashboardModalState = {
  registerVehicleOpen: false,
  verifiedVehicle: null,
  viewVehicleId: null,
};

const dashboardModalSlice = createSlice({
  name: "dashboardModal",
  initialState,
  reducers: {
    openRegisterVehicle: (state) => {
      state.registerVehicleOpen = true;
    },
    closeRegisterVehicle: (state) => {
      state.registerVehicleOpen = false;
    },
    showVerifiedVehicle: (state, action: PayloadAction<Omit<Vehicle, "id">>) => {
      state.registerVehicleOpen = false;
      state.verifiedVehicle = action.payload;
    },
    closeVerifiedVehicle: (state) => {
      state.verifiedVehicle = null;
    },
    // "Not your vehicle": discard the lookup result and go back to VIN entry
    rejectVerifiedVehicle: (state) => {
      state.verifiedVehicle = null;
      state.registerVehicleOpen = true;
    },
    openVehicleDetails: (state, action: PayloadAction<string>) => {
      state.viewVehicleId = action.payload;
    },
    closeVehicleDetails: (state) => {
      state.viewVehicleId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addVehicle, (state) => {
        state.verifiedVehicle = null;
      })
      .addCase(removeVehicle, (state, action) => {
        if (state.viewVehicleId === action.payload) {
          state.viewVehicleId = null;
        }
      });
  },
});

export const {
  openRegisterVehicle,
  closeRegisterVehicle,
  showVerifiedVehicle,
  closeVerifiedVehicle,
  rejectVerifiedVehicle,
  openVehicleDetails,
  closeVehicleDetails,
} = dashboardModalSlice.actions;

export const selectDashboardModal = (state: RootState) => state.dashboardModal;

export default dashboardModalSlice.reducer;
