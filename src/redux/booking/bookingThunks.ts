import type { AppDispatch, RootState } from "@/redux/store";
import { bookingCreated } from "@/redux/tracking/trackingSlice";
import {
  selectBookingAddress,
  selectBookingDealership,
  selectBookingVehicle,
} from "./bookingSlice";
import { bookingApi } from "@/services/bookingApi";

// Sends the booking in progress to the API, then snapshots it into the tracking slice.
// Resolves false when a vehicle, pickup location or dealership is missing, or the API fails
// (the API layer has already shown the error).
export const confirmBooking =
  (scheduledAt: string | null = null) =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<boolean> => {
    const state = getState();
    const vehicle = selectBookingVehicle(state);
    const address = selectBookingAddress(state);
    const dealership = selectBookingDealership(state);
    const location = state.booking.pickupLocation;

    const pickup =
      location?.type === "current"
        ? { label: location.label }
        : address && {
            address: address.address,
            city: address.city,
            state: address.state,
            zip: address.zip,
          };

    if (!vehicle || !pickup || !dealership) {
      return false;
    }

    // Loaner Only has no driveable question; the customer drives the car in
    const driveable =
      state.booking.selectedServiceId === "loaner-only" || state.booking.driveable;

    try {
      const created = await bookingApi.create({
        serviceId: state.booking.selectedServiceId,
        vehicle: {
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          vin: vehicle.vin,
        },
        pickup:
          location?.type === "current"
            ? location.label
            : `${address!.address}, ${address!.city}, ${address!.state} ${address!.zip}`,
        dealershipName: dealership.name,
        driveable,
        concern: state.booking.concern,
        scheduledAt,
      });

      dispatch(
        bookingCreated({
          id: created.id,
          serviceId: created.serviceId,
          vehicle,
          pickup,
          dealership,
          driveable,
          concern: created.concern,
          scheduledAt,
          createdAt: created.createdAt,
          status: created.status,
        }),
      );

      return true;
    } catch {
      return false;
    }
  };
