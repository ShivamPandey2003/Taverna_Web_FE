import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { offerApi } from "@/services/offerApi";
import { profileKeys } from "@/services/queries/profileQueries";
import type { CustomerOfferParams } from "@/types/offer";
import type { Profile } from "@/types/profile";

export const offerKeys = {
  customer: (params: CustomerOfferParams) => ["offers", "customer", params] as const,
};

// The customer's offers (Specials page), one page at a time; a new filter or
// page loads again with the current cards left up meanwhile. The API layer
// toasts a failure, so it isn't retried.
export function useCustomerOffers(params: CustomerOfferParams) {
  return useQuery({
    queryKey: offerKeys.customer(params),
    queryFn: () => offerApi.list(params),
    placeholderData: keepPreviousData,
    retry: false,
  });
}

// Opening Specials clears the navbar's "new specials" dot: straight away in the
// cached profile, then on the server (offers/mark-seen). A failed call puts the
// dot back (the API layer toasts it).
export function useMarkSpecialsSeen() {
  const queryClient = useQueryClient();
  const setNew = (hasNewSpecials: boolean) =>
    queryClient.setQueryData<Profile>(profileKeys.profile, (profile) =>
      profile ? { ...profile, hasNewSpecials } : profile,
    );

  return useMutation({
    mutationFn: offerApi.markSeen,
    onMutate: () => {
      const hadNew = queryClient.getQueryData<Profile>(profileKeys.profile)?.hasNewSpecials;
      setNew(false);
      return { hadNew };
    },
    onError: (_error, _variables, context) => {
      if (context?.hadNew) setNew(true);
    },
  });
}
