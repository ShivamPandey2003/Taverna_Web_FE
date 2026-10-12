import type { AppDispatch, RootState } from "@/redux/store";
import { bookingCreated } from "@/redux/tracking/trackingSlice";
import {
  selectBookingAddress,
  selectBookingDealership,
  selectBookingVehicle,
} from "./bookingSlice";
import { bookingApi } from "@/services/bookingApi";

// Sends the booking in progress to the API, then snapshots it into the tracking slice.
// Resolves the new booking's id, or null when a vehicle, pickup location or dealership is
// missing, or the API fails (the API layer has already shown the error).
export const confirmBooking =
  () =>
  async (dispatch: AppDispatch, getState: () => RootState): Promise<string | null> => {
    const state = getState();
    const vehicle = selectBookingVehicle(state);
    const address = selectBookingAddress(state);
    const dealership = selectBookingDealership(state);
    const location = state.booking.pickupLocation;
    // Loaner Only has no pickup to schedule
    const scheduledAt =
      state.booking.selectedServiceId === "loaner-only" ? null : state.booking.scheduledAt;

    const pickup =
      location?.type === "current"
        ? { label: location.label }
        : address && {
            address: address.address,
            city: address.city,
            state: address.state,
            zip: address.zip,
          };

    // The API books against a saved address (it checks the distance to the dealership)
    if (!vehicle || !pickup || !dealership || !address) {
      return null;
    }

    // Loaner Only has no driveable question; the customer drives the car in
    const driveable =
      state.booking.selectedServiceId === "loaner-only" || state.booking.driveable;
    // A vehicle that can't be driven is towed in unless the customer took the tow truck off
    const towTruck = driveable ? undefined : state.booking.towTruck;

    try {
      const created = await bookingApi.create({
        vehicleId: vehicle.id,
        dealershipId: dealership.id,
        addressId: address.id,
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
        towTruck,
        concern: state.booking.concern,
        scheduledAt,
      });

      dispatch(
        bookingCreated({
          id: created.id,
          serviceId: state.booking.selectedServiceId,
          vehicle,
          pickup,
          dealership,
          driveable,
          towTruck,
          concern: state.booking.concern,
          scheduledAt,
          createdAt: created.createdAt,
          status: created.status,
        }),
      );

      return created.id;
    } catch {
      return null;
    }
  };
