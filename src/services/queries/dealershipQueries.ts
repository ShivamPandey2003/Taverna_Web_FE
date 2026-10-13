import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dealershipApi,
  type Coordinates,
  type DealershipInput,
} from "@/services/dealershipApi";
import { geocodeText } from "@/services/geocodeApi";
import { adminKeys } from "@/services/queries/adminQueries";
import type { Dealership } from "@/types/dealership";

export const dealershipKeys = {
  root: ["dealerships"] as const,
  all: ["dealerships", "all"] as const,
  near: ({ latitude, longitude }: Coordinates) =>
    ["dealerships", "near", latitude, longitude] as const,
  admin: ["dealerships", "admin"] as const,
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

function matchesDealership(dealership: Dealership, search: string) {
  const query = search.trim().toLowerCase();
  return [dealership.name, dealership.address].some((value) =>
    value.toLowerCase().includes(query),
  );
}

// The admin page's list. The API has no search, so the list is fetched once
// and filtered in the browser.
export function useAdminDealerships(search: string) {
  return useQuery({
    queryKey: dealershipKeys.admin,
    queryFn: dealershipApi.listAll,
    retry: false,
    select: (dealerships) =>
      dealerships.filter((dealership) => matchesDealership(dealership, search)),
  });
}

// Finds a dealership's coordinates before it's saved. Not one of our API's
// calls, so nothing toasts its failures: the dealership form reports them.
export function useGeocodeDealership() {
  return useMutation({ mutationFn: geocodeText });
}

// Add and edit refresh every dealership list, the customer's included
function useDealershipMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dealershipKeys.root });
      // Renaming a dealership also renames it on its bookings
      queryClient.invalidateQueries({ queryKey: adminKeys.bookings });
    },
  });
}

export const useCreateDealership = () =>
  useDealershipMutation(({ dealerId, input }: { dealerId: string; input: DealershipInput }) =>
    dealershipApi.create(dealerId, input),
  );

export const useUpdateDealership = () =>
  useDealershipMutation(({ id, input }: { id: string; input: DealershipInput }) =>
    dealershipApi.update(id, input),
  );
