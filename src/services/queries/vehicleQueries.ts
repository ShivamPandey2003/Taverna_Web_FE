import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vehicleApi } from "@/services/vehicleApi";
import type { Vehicle, VehicleOverview } from "@/types/vehicle";

export const vehicleKeys = {
  list: ["vehicles"] as const,
  overview: (vehicleId: string) => ["vehicles", vehicleId, "overview"] as const,
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

// One vehicle with its service history, for the details modal. Only runs while
// a vehicle is open there.
export function useVehicleOverview(vehicleId: string | null) {
  return useQuery({
    queryKey: vehicleKeys.overview(vehicleId ?? ""),
    queryFn: () => vehicleApi.overview(vehicleId as string),
    enabled: Boolean(vehicleId),
    retry: false,
  });
}

// Decodes a VIN; resolves to the vehicle for the customer to confirm
export function useVerifyVin() {
  return useMutation({ mutationFn: vehicleApi.verifyVin });
}

// Saves a vehicle's mileage and puts it in the cached list and overview, so
// useSyncVehicles copies it into Redux
export function useUpdateMileage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vehicleId, mileage }: { vehicleId: string; mileage: number }) =>
      vehicleApi.updateMileage(vehicleId, mileage),
    onSuccess: (miles, { vehicleId }) => {
      const withMiles = (vehicle: Vehicle) =>
        vehicle.id === vehicleId ? { ...vehicle, miles } : vehicle;
      queryClient.setQueryData<Vehicle[]>(vehicleKeys.list, (vehicles) => vehicles?.map(withMiles));
      queryClient.setQueryData<VehicleOverview>(vehicleKeys.overview(vehicleId), (overview) =>
        overview && { ...overview, vehicle: withMiles(overview.vehicle) },
      );
    },
  });
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
