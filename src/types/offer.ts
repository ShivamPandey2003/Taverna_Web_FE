import type { Paginated, SortOrder } from "./admin";

// A vehicle offer, one row of the dealership's offers CSV (see offerCsv.ts for
// the columns it comes from)
export interface Offer {
  id: string;
  vin: string;
  stockNumber: string;
  brand: string;
  year: number;
  model: string;
  trim: string;
  // "New", "Used", ...
  condition: string;
  // e.g. "First and Fees", "Low APR Finance Deal"
  offerType: string;
  // Monthly payment, with and without tax
  payment: number;
  paymentNoTax: number;
  totalRebate: number;
  // Months
  term: number;
  downPayment: number;
  dueAtSigning: number;
  // Percent, e.g. 6.471
  apr: number;
  lender: string;
  description: string;
  disclaimer: string;
}

// What the admin can change on an offer: everything but its id
export type OfferInput = Omit<Offer, "id">;

export type OfferSortField = "vin" | "stockNumber" | "vehicle" | "offerType" | "payment" | "term" | "apr";

export interface OfferListParams {
  page: number;
  pageSize: number;
  sortBy: OfferSortField;
  sortOrder: SortOrder;
  search: string;
  condition: string;
  offerType: string;
}

// A page of offers, plus every condition and offer type there is to filter by
// (they come from the uploaded file, so the page can't know them up front)
export interface OfferList extends Paginated<Offer> {
  conditions: string[];
  offerTypes: string[];
}
