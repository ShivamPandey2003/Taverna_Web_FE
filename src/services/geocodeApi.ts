import type { Address } from "@/types/address";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// The parts of an address that say where it is (the apartment doesn't)
export type AddressPlace = Pick<Address, "address" | "city" | "state" | "zip">;

// "notFound": no such place, so the address is probably mistyped.
// "failed": the lookup itself didn't work (offline, service down); worth another try.
export class GeocodeError extends Error {
  reason: "notFound" | "failed";

  constructor(reason: "notFound" | "failed") {
    super(reason === "notFound" ? "Address not found" : "Address lookup failed");
    this.reason = reason;
  }
}

// OpenStreetMap's free address search, the same service the location slice uses
// to name the device's position. No key; meant for the odd lookup, not bulk use.
const SEARCH_URL = "https://nominatim.openstreetmap.org/search";

async function search(params: Record<string, string>): Promise<Coordinates | null> {
  const query = new URLSearchParams({ ...params, format: "jsonv2", limit: "1" });

  let results: { lat: string; lon: string }[];
  try {
    const response = await fetch(`${SEARCH_URL}?${query}`, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Search answered ${response.status}`);
    results = await response.json();
  } catch {
    throw new GeocodeError("failed");
  }

  const latitude = Number(results[0]?.lat);
  const longitude = Number(results[0]?.lon);
  return results.length && Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude }
    : null;
}

// Where an address is, for the API's `latitude` / `longitude`. Tries the exact
// street first, then falls back to its ZIP code and city: a new or unlisted
// street still gets the coordinates of its area. Throws a GeocodeError when
// nothing matches or the lookup can't be made.
export async function geocodeAddress(place: AddressPlace): Promise<Coordinates> {
  const { address: street, city, state, zip: postalcode } = place;

  const attempts: Record<string, string>[] = [
    { street, city, state, postalcode },
    { q: `${street}, ${city}, ${state} ${postalcode}` },
    { city, state, postalcode },
    { city, state },
  ];

  for (const params of attempts) {
    const coordinates = await search(params);
    if (coordinates) return coordinates;
  }

  throw new GeocodeError("notFound");
}
