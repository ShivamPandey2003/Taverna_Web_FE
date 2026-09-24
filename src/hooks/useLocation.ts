import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCurrentLocation, selectLocation } from "@/redux/location/locationSlice";

// Current device location, shared app-wide through the location slice
export function useLocation() {
    const dispatch = useAppDispatch();
    const { address, coordinates, loading, error } = useAppSelector(selectLocation);

    const getLocation = useCallback(() => {
        dispatch(fetchCurrentLocation());
    }, [dispatch]);

    return {
        address,
        coordinates,
        loading,
        error,
        getLocation,
    };
}
