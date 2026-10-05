import { useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { setVehicles } from "@/redux/vehicle/vehicleSlice";
import { useVehicles } from "@/services/queries/vehicleQueries";

// Keeps the Redux vehicle list in step with the customer's saved vehicles on the
// server, so every dashboard page (and the booking selectors) can read them
export function useSyncVehicles(enabled: boolean) {
  const dispatch = useAppDispatch();
  const { data: vehicles } = useVehicles(enabled);

  useEffect(() => {
    if (enabled && vehicles) {
      dispatch(setVehicles(vehicles));
    }
  }, [dispatch, enabled, vehicles]);
}
