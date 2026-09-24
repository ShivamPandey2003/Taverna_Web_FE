import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { dealerships } from "@/components/features/review/dealership.data";
import { services } from "@/components/features/booking/booking.data";
import { bookingCreated } from "@/redux/tracking/trackingSlice";
import { logout } from "@/redux/auth/authSlice";
import { selectVehicleById } from "@/redux/vehicle/vehicleSlice";
import { selectAddressById, selectDefaultAddress } from "@/redux/address/addressSlice";
import type { PickupLocation } from "@/types/booking";
import type { ServiceId } from "@/types/service";

// The booking currently being put together (Book Service -> Review)
type BookingState = {
  selectedVehicleId: string | null;
  selectedServiceId: ServiceId;
  // null means "use the default saved address"
  pickupLocation: PickupLocation | null;
  selectedDealershipId: string;
  driveable: boolean;
  concern: string;
};

const initialState: BookingState = {
  selectedVehicleId: null,
  selectedServiceId: "pickup-delivery",
  pickupLocation: null,
  selectedDealershipId: dealerships[0].id,
  driveable: true,
  concern: "",
};

const bookingSlice = createSlice({
  name: "booking",
  initialState,
  reducers: {
    setSelectedVehicle: (state, action: PayloadAction<string>) => {
      state.selectedVehicleId = action.payload;
    },
    setSelectedService: (state, action: PayloadAction<ServiceId>) => {
      state.selectedServiceId = action.payload;
    },
    setPickupLocation: (state, action: PayloadAction<PickupLocation>) => {
      state.pickupLocation = action.payload;
    },
    setSelectedDealership: (state, action: PayloadAction<string>) => {
      state.selectedDealershipId = action.payload;
    },
    setDriveable: (state, action: PayloadAction<boolean>) => {
      state.driveable = action.payload;
    },
    setConcern: (state, action: PayloadAction<string>) => {
      state.concern = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Clear the per-booking inputs once a booking is placed; keep vehicle/dealership choices
    builder
      .addCase(bookingCreated, (state) => {
        state.driveable = true;
        state.concern = "";
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setSelectedVehicle,
  setSelectedService,
  setPickupLocation,
  setSelectedDealership,
  setDriveable,
  setConcern,
} = bookingSlice.actions;

export const selectBooking = (state: RootState) => state.booking;

export const selectBookingVehicle = (state: RootState) =>
  selectVehicleById(state, state.booking.selectedVehicleId);

export const selectBookingService = (state: RootState) =>
  services.find((service) => service.id === state.booking.selectedServiceId) ??
  services[0];

// Saved address used for pickup; null when the current location is used
export const selectBookingAddress = (state: RootState) => {
  const location = state.booking.pickupLocation;
  if (location?.type === "current") return null;
  if (location?.type === "saved") {
    return selectAddressById(state, location.addressId) ?? selectDefaultAddress(state);
  }
  return selectDefaultAddress(state);
};

export const selectBookingDealership = (state: RootState) =>
  dealerships.find(
    (dealership) => dealership.id === state.booking.selectedDealershipId,
  ) ?? null;

export default bookingSlice.reducer;
