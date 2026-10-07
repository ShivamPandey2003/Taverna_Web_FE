import { useQuery } from "@tanstack/react-query";
import { dealershipApi, type Coordinates } from "@/services/dealershipApi";

export const dealershipKeys = {
  all: ["dealerships", "all"] as const,
  near: ({ latitude, longitude }: Coordinates) =>
    ["dealerships", "near", latitude, longitude] as const,
};

// Every dealership, for the customer to pick from. Fetched each time the
// Select Dealership modal opens.
export function useAllDealerships() {
  return useQuery({
    queryKey: dealershipKeys.all,
    queryFn: () => dealershipApi.list(),
    // The API layer toasts every failure, so retrying would repeat the toast
    retry: false,
  });
}

// Dealerships for the customer's location, closest first. Waits for coordinates.
export function useNearbyDealerships(coordinates: Coordinates | null) {
  return useQuery({
    queryKey: dealershipKeys.near(coordinates ?? { latitude: 0, longitude: 0 }),
    queryFn: () => dealershipApi.list(coordinates as Coordinates),
    enabled: Boolean(coordinates),
    retry: false,
  });
}
