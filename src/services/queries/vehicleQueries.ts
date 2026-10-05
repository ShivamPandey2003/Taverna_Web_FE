import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehicleApi } from "@/services/vehicleApi";
import type { Vehicle } from "@/types/vehicle";

export const vehicleKeys = {
  list: ["vehicles"] as const,
};

// The customer's saved vehicles. useSyncVehicles copies the result into Redux,
// which is where components and the booking selectors read vehicles from.
export function useVehicles(enabled = true) {
  return useQuery({
    queryKey: vehicleKeys.list,
    queryFn: vehicleApi.list,
    enabled,
    // The API layer toasts every failure, so retrying would repeat the toast
    retry: false,
  });
}

// Decodes a VIN; resolves to the vehicle for the customer to confirm
export function useVerifyVin() {
  return useMutation({ mutationFn: vehicleApi.verifyVin });
}

// Saves the confirmed vehicle and adds it to the cached list
export function useSaveVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: vehicleApi.save,
    onSuccess: (vehicle) => {
      queryClient.setQueryData<Vehicle[]>(vehicleKeys.list, (vehicles = []) => [
        vehicle,
        ...vehicles.filter((item) => item.id !== vehicle.id),
      ]);
    },
  });
}
