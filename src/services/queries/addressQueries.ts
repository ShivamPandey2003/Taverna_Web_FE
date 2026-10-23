import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { addressApi } from "@/services/addressApi";
import { geocodeAddress } from "@/services/geocodeApi";
import type { Address, AddressInput } from "@/types/address";

export const addressKeys = {
  list: ["addresses"] as const,
};

// The customer's saved addresses. useSyncAddresses copies the result into Redux,
// which is where components and the booking selectors read addresses from.
export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: addressKeys.list,
    queryFn: addressApi.list,
    enabled,
    // The API layer toasts every failure, so retrying would repeat the toast
    retry: false,
  });
}

// Shows a change straight away, then asks the server for its own list (it decides
// which address is the default when that one changes)
function applyChange(queryClient: QueryClient, change: (addresses: Address[]) => Address[]) {
  queryClient.setQueryData<Address[]>(addressKeys.list, (addresses = []) => change(addresses));
  return queryClient.invalidateQueries({ queryKey: addressKeys.list });
}

// Only one address is the default: saving one as default takes it from the rest
const withSaved = (addresses: Address[], saved: Address) =>
  addresses.map((item) => {
    if (item.id === saved.id) return saved;
    return saved.isDefault ? { ...item, isDefault: false } : item;
  });

// Finds an address's coordinates before it's saved. Not one of our API's calls,
// so nothing toasts its failures: the address form reports them.
export function useGeocodeAddress() {
  return useMutation({ mutationFn: geocodeAddress });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressApi.create,
    onSuccess: (address) => {
      applyChange(queryClient, (addresses) =>
        withSaved([address, ...addresses.filter((item) => item.id !== address.id)], address),
      );
    },
  });
}

// Edits an address; "Set as Default" is the same call with isDefault on
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, address }: { id: string; address: AddressInput }) =>
      addressApi.update(id, address),
    onSuccess: (address) => {
      applyChange(queryClient, (addresses) => withSaved(addresses, address));
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressApi.remove,
    onSuccess: (id) => {
      applyChange(queryClient, (addresses) => addresses.filter((item) => item.id !== id));
    },
  });
}
