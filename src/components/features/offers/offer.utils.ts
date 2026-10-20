// offers/list's `condition` filter: new, used or all (left out)
export const OFFER_CONDITIONS = ["New", "Used"] as const;

// The offer types the dealership uses, in the filters' order. The API has no
// list of them, so the filters offer these; add new ones here as they turn up.
export const OFFER_TYPES = [
  "First and Fees",
  "10% MSRP",
  "Sign and Drive",
  "Low APR Finance Deal",
] as const;
