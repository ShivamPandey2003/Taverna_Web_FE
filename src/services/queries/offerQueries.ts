import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { offerApi } from "@/services/offerApi";
import type { CustomerOfferParams } from "@/types/offer";

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
