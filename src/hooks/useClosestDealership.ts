import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectBookingDealership,
  setSelectedDealership,
} from "@/redux/booking/bookingSlice";
import { useLocation } from "@/hooks/useLocation";
import { useNearbyDealerships } from "@/services/queries/dealershipQueries";

// On the review page: asks for the customer's location, fetches the dealerships
// for it and selects the closest one. Leaves a dealership the customer already
// has selected alone. Resolves `loading` while the closest one is being found.
export function useClosestDealership() {
  const dispatch = useAppDispatch();
  const selected = useAppSelector(selectBookingDealership);
  const { coordinates, loading: locating, error, getLocation } = useLocation();

  useEffect(() => {
    if (!coordinates && !locating && !error) {
      getLocation();
    }
  }, [coordinates, locating, error, getLocation]);

  const { data: nearby, isLoading } = useNearbyDealerships(
    coordinates && { latitude: coordinates.latitude, longitude: coordinates.longitude },
  );
  const closest = nearby?.[0];

  useEffect(() => {
    if (closest && !selected) {
      dispatch(setSelectedDealership(closest));
    }
  }, [dispatch, closest, selected]);

  return { loading: !selected && (locating || isLoading) };
}
