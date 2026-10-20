// offers/list's `condition` filter: new, used or all (left out)
export const OFFER_CONDITIONS = ["New", "Used"] as const;

// An offer's end date ("2026-08-31", its last day) as "Aug 31, 2026", and
// whether that day is over. Read as a local date, so it never shifts a day.
export function offerExpiry(expiresAt: string | null) {
  const match = expiresAt?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const lastDay = new Date(year, month - 1, day);
  return {
    label: lastDay.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    expired: new Date(year, month - 1, day + 1) <= new Date(),
  };
}

// The offer types the dealership uses, in the filters' order. The API has no
// list of them, so the filters offer these; add new ones here as they turn up.
export const OFFER_TYPES = [
  "First and Fees",
  "10% MSRP",
  "Sign and Drive",
  "Low APR Finance Deal",
] as const;
