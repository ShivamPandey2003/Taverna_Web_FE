// offers/list's `condition` filter: new, used or all (left out)
export const OFFER_CONDITIONS = ["New", "Used"] as const;

// The offer types seen in the dealership's files. The API has no list of them,
// so the filter offers these; add new ones here as they turn up.
export const OFFER_TYPES = [
  "10% MSRP",
  "Cash Rebate Deal",
  "First and Fees",
  "Low APR Finance Deal",
  "Sign and Drive",
  "Zero Down Lease",
] as const;
