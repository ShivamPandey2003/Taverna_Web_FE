import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { logout } from "@/redux/auth/authSlice";
import type { Vehicle } from "@/types/vehicle";

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
    addVehicle: {
      reducer: (state, action: PayloadAction<Vehicle>) => {
        state.vehicleList.unshift(action.payload);
      },
      prepare: (vehicle: Omit<Vehicle, "id">) => ({
        payload: { ...vehicle, id: nanoid() },
      }),
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

export const { addVehicle, editVehicle, removeVehicle } = vehicleSlice.actions;

export const selectVehicles = (state: RootState) => state.vehicle.vehicleList;

export const selectVehicleById = (state: RootState, id: string | null) =>
  state.vehicle.vehicleList.find((vehicle) => vehicle.id === id) ?? null;

export default vehicleSlice.reducer;
