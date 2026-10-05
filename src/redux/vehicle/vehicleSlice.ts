import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { logout } from "@/redux/auth/authSlice";
import type { Vehicle } from "@/types/vehicle";

// Mirror of the customer's saved vehicles on the server (see useSyncVehicles)
type VehicleState = {
  vehicleList: Vehicle[];
};

const initialState: VehicleState = {
  vehicleList: [],
};

const vehicleSlice = createSlice({
  name: "vehicle",
  initialState,
  reducers: {
    // The list as the server returned it. There's no endpoint for updating
    // mileage yet, so miles typed in here (editVehicle) are kept until the server
    // has its own.
    setVehicles: (state, action: PayloadAction<Vehicle[]>) => {
      const localMiles = new Map(state.vehicleList.map((item) => [item.id, item.miles]));
      state.vehicleList = action.payload.map((vehicle) => ({
        ...vehicle,
        miles: vehicle.miles ?? localMiles.get(vehicle.id) ?? null,
      }));
    },
    // A vehicle the server just saved
    addVehicle: (state, action: PayloadAction<Vehicle>) => {
      if (!state.vehicleList.some((item) => item.id === action.payload.id)) {
        state.vehicleList.unshift(action.payload);
      }
    },
    editVehicle: (state, action: PayloadAction<Vehicle>) => {
      state.vehicleList = state.vehicleList.map((item) =>
        item.id === action.payload.id ? action.payload : item,
      );
    },
    removeVehicle: (state, action: PayloadAction<string>) => {
      state.vehicleList = state.vehicleList.filter(
        (item) => item.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    // Each account starts with its own empty data
    builder.addCase(logout, () => initialState);
  },
});

export const { setVehicles, addVehicle, editVehicle, removeVehicle } = vehicleSlice.actions;

export const selectVehicles = (state: RootState) => state.vehicle.vehicleList;

export const selectVehicleById = (state: RootState, id: string | null) =>
  state.vehicle.vehicleList.find((vehicle) => vehicle.id === id) ?? null;

export default vehicleSlice.reducer;
