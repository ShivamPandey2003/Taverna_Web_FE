import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { services } from "@/components/features/booking/booking.data";
import { bookingCreated } from "@/redux/tracking/trackingSlice";
import { logout } from "@/redux/auth/authSlice";
import { selectVehicleById } from "@/redux/vehicle/vehicleSlice";
import { selectAddressById, selectDefaultAddress } from "@/redux/address/addressSlice";
import type { PickupLocation } from "@/types/booking";
import type { Dealership } from "@/types/dealership";
import type { ServiceId } from "@/types/service";

// The booking currently being put together (Book Service -> Review)
type BookingState = {
  selectedVehicleId: string | null;
  selectedServiceId: ServiceId;
  // null means "use the default saved address"
  pickupLocation: PickupLocation | null;
  // A copy, not an id: dealerships come from the API and aren't kept in Redux.
  // null until the review page finds the closest one or the customer picks one.
  selectedDealership: Dealership | null;
  driveable: boolean;
  // A vehicle that can't be driven gets a tow truck unless the customer takes it
  // off (it only counts while `driveable` is false)
  towTruck: boolean;
  concern: string;
  // Pickup time the customer scheduled (ISO); null books for as soon as possible
  scheduledAt: string | null;
};

const initialState: BookingState = {
  selectedVehicleId: null,
  selectedServiceId: "pickup-delivery",
  pickupLocation: null,
  selectedDealership: null,
  driveable: true,
  towTruck: true,
  concern: "",
  scheduledAt: null,
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
    // The customer picked another pickup: the dealership is cleared so the
    // review page selects the one closest to the new address
    // (useClosestDealership). The same pickup again keeps it.
    changePickupLocation: (state, action: PayloadAction<PickupLocation>) => {
      if (JSON.stringify(state.pickupLocation) !== JSON.stringify(action.payload)) {
        state.selectedDealership = null;
      }
      state.pickupLocation = action.payload;
    },
    setSelectedDealership: (state, action: PayloadAction<Dealership>) => {
      state.selectedDealership = action.payload;
    },
    setDriveable: (state, action: PayloadAction<boolean>) => {
      state.driveable = action.payload;
      // Answering again starts from the default: towed in
      state.towTruck = true;
    },
    setTowTruck: (state, action: PayloadAction<boolean>) => {
      state.towTruck = action.payload;
    },
    setConcern: (state, action: PayloadAction<string>) => {
      state.concern = action.payload;
    },
    setScheduledAt: (state, action: PayloadAction<string | null>) => {
      state.scheduledAt = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Clear the per-booking inputs once a booking is placed; keep vehicle/dealership choices
    builder
      .addCase(bookingCreated, (state) => {
        state.driveable = true;
        state.towTruck = true;
        state.concern = "";
        state.scheduledAt = null;
      })
      .addCase(logout, () => initialState);
  },
});

export const {
  setSelectedVehicle,
  setSelectedService,
  setPickupLocation,
  changePickupLocation,
  setSelectedDealership,
  setDriveable,
  setTowTruck,
  setConcern,
  setScheduledAt,
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
  state.booking.selectedDealership;

export default bookingSlice.reducer;
