// A vehicle offer, one row of offers/list (uploaded from the dealership's offers
// CSV; see offerCsv.ts for its columns)
export interface Offer {
  id: string;
  vin: string;
  stockNumber: string;
  brand: string;
  year: number;
  model: string;
  trim: string;
  // "2027 Chrysler Pacifica Select"
  vehicleName: string;
  // "New" or "Used"
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

// What the admin can change on an offer (offers/update): everything but its id
// and the name the API builds from year, brand, model and trim
export type OfferInput = Omit<Offer, "id" | "vehicleName">;

// What the customer's offers (GET offers) are asked for: a model they own
// (both empty for every offer) and a kind of deal ("all" for any)
export interface CustomerOfferParams {
  page: number;
  pageSize: number;
  brandName: string;
  model: string;
  offerType: string;
}

// What offers/list is asked for; "all" sends no filter. The API has no sorting.
export interface OfferListParams {
  page: number;
  pageSize: number;
  search: string;
  condition: string;
  offerType: string;
}
