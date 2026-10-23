import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectBookingAddress,
  selectBookingDealership,
  setSelectedDealership,
} from "@/redux/booking/bookingSlice";
import { useLocation } from "@/hooks/useLocation";
import { useNearbyDealerships } from "@/services/queries/dealershipQueries";

// On the review page: fetches the dealerships near the pickup and selects the
// closest one. "Near" is measured from the pickup address (where the vehicle
// is); only a pickup with no saved address, or one saved without coordinates,
// asks for the device's location instead. Leaves a dealership the customer
// already has selected alone. Resolves `loading` while the closest one is being
// found.
export function useClosestDealership() {
  const dispatch = useAppDispatch();
  const selected = useAppSelector(selectBookingDealership);
  const address = useAppSelector(selectBookingAddress);
  const { coordinates: device, loading: locating, error, getLocation } = useLocation();

  const pickup =
    address?.latitude != null && address.longitude != null
      ? { latitude: address.latitude, longitude: address.longitude }
      : null;
  const needsDevice = !pickup;

  useEffect(() => {
    if (needsDevice && !device && !locating && !error) {
      getLocation();
    }
  }, [needsDevice, device, locating, error, getLocation]);

  const { data: nearby, isLoading } = useNearbyDealerships(
    pickup ?? (device && { latitude: device.latitude, longitude: device.longitude }),
  );
  const closest = nearby?.[0];

  useEffect(() => {
    if (closest && !selected) {
      dispatch(setSelectedDealership(closest));
    }
  }, [dispatch, closest, selected]);

  return { loading: !selected && ((needsDevice && locating) || isLoading) };
}
