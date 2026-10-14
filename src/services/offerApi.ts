import { request, toQueryString } from "./apiClient";
import type { Paginated } from "@/types/admin";
import type { CustomerOfferParams, Offer } from "@/types/offer";

// An offer as offers/list (admin) and offers (customer) send it. The customer
// list has only been seen empty, so its rows are taken to be the same.
export interface OfferResponse {
  vehicleOfferId: string;
  vin: string;
  stockNumber: string;
  condition: string;
  year: number;
  brandName: string;
  model: string;
  trim: string;
  offerType: string;
  lender: string;
  payment: number;
  paymentNoTax: number;
  termMonths: number;
  apr: number;
  downPayment: number;
  dueAtSigning: number;
  totalRebate: number;
  description: string | null;
  disclaimer: string | null;
  vehicleName: string | null;
}

export interface OfferPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function toOffer(offer: OfferResponse): Offer {
  return {
    id: offer.vehicleOfferId,
    vin: offer.vin,
    stockNumber: offer.stockNumber,
    brand: offer.brandName,
    year: offer.year,
    model: offer.model,
    trim: offer.trim,
    vehicleName:
      offer.vehicleName ||
      [offer.year, offer.brandName, offer.model, offer.trim].filter(Boolean).join(" "),
    condition: offer.condition,
    offerType: offer.offerType,
    payment: Number(offer.payment) || 0,
    paymentNoTax: Number(offer.paymentNoTax) || 0,
    totalRebate: Number(offer.totalRebate) || 0,
    term: Number(offer.termMonths) || 0,
    downPayment: Number(offer.downPayment) || 0,
    dueAtSigning: Number(offer.dueAtSigning) || 0,
    apr: Number(offer.apr) || 0,
    lender: offer.lender,
    description: offer.description ?? "",
    disclaimer: offer.disclaimer ?? "",
  };
}

// A page of offers, as both lists send it
export const toOfferPage = (
  offers: OfferResponse[],
  pagination: OfferPagination,
): Paginated<Offer> => ({
  items: offers.map(toOffer),
  total: pagination.totalItems,
  page: pagination.page,
  pageSize: pagination.pageSize,
  // 0 when there are no offers; the pager wants at least one page
  totalPages: Math.max(1, pagination.totalPages),
});

// Customer-side offers (the Specials page)
export const offerApi = {
  // Real API: GET offers. `brandName` / `model` narrow it to a model the
  // customer owns and `offerType` to one kind of deal; empty ones and "all"
  // are left out. At most 100 a page.
  list: async (params: CustomerOfferParams): Promise<Paginated<Offer>> => {
    const { offers, pagination } = await request<{
      offers: OfferResponse[];
      pagination: OfferPagination;
    }>(
      "get",
      `offers${toQueryString({
        page: params.page,
        pageSize: Math.min(params.pageSize, 100),
        brandName: params.brandName,
        model: params.model,
        offerType: params.offerType,
      })}`,
    );
    return toOfferPage(offers ?? [], pagination);
  },
};
