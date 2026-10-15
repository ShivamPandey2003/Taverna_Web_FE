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

  return firstMatch(attempts);
}

// The same for an address typed on one line ("777 N State Road 7, Plantation,
// FL 33317"), as a dealership's is. Falls back to what follows the street.
export async function geocodeText(address: string): Promise<Coordinates> {
  const area = address.split(",").slice(1).join(",").trim();

  return firstMatch([{ q: address }, ...(area ? [{ q: area }] : [])]);
}

async function firstMatch(attempts: Record<string, string>[]): Promise<Coordinates> {
  for (const params of attempts) {
    const coordinates = await search(params);
    if (coordinates) return coordinates;
  }

  throw new GeocodeError("notFound");
}

// ---- Position → address ----

// Nominatim's reverse lookup names the parts of an address by the kind of place,
// which differs from country to country: take the first one that's there
type NominatimAddress = Partial<Record<string, string>>;

export function fromNominatimAddress(
  address: NominatimAddress | undefined,
  displayName: string | null,
): AddressPlace | null {
  if (!address) return null;

  const first = (...keys: string[]) =>
    keys.map((key) => address[key]?.trim()).find((value) => !!value) ?? "";

  return {
    address:
      [address.house_number, address.road].filter(Boolean).join(" ") ||
      first("neighbourhood", "suburb", "quarter", "residential") ||
      displayName?.split(",")[0]?.trim() ||
      "",
    city: first("city", "town", "village", "municipality", "city_district", "county", "state_district"),
    state: first("state", "region", "state_district"),
    zip: first("postcode"),
  };
}

async function reverseWithNominatim(latitude: number, longitude: number) {
  const query = new URLSearchParams({ lat: String(latitude), lon: String(longitude), format: "json" });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Reverse lookup answered ${response.status}`);
  const data = await response.json();
  return fromNominatimAddress(data.address, data.display_name ?? null);
}

// Google's answer, in our fields. The state is its short name ("FL"), as the
// address form asks for.
function fromGoogleResult(result: google.maps.GeocoderResult): AddressPlace {
  const part = (type: string, short = false) => {
    const component = result.address_components.find((item) => item.types.includes(type));
    return (short ? component?.short_name : component?.long_name) ?? "";
  };

  return {
    address:
      [part("street_number"), part("route")].filter(Boolean).join(" ") ||
      part("neighborhood") ||
      part("sublocality") ||
      result.formatted_address.split(",")[0]?.trim() ||
      "",
    city: part("locality") || part("postal_town") || part("sublocality") || part("administrative_area_level_2"),
    state: part("administrative_area_level_1", true),
    zip: part("postal_code"),
  };
}

// Google's Geocoder once its script has loaded (the types assume it always has);
// null before then
async function googleGeocoder() {
  const maps =
    typeof google === "undefined" ? undefined : (google.maps as Partial<typeof google.maps> | undefined);
  if (!maps?.importLibrary) return null;
  const { Geocoder } = (await google.maps.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
  return new Geocoder();
}

async function reverseWithGoogle(latitude: number, longitude: number) {
  const geocoder = await googleGeocoder();
  if (!geocoder) return null;
  const { results } = await geocoder.geocode({ location: { lat: latitude, lng: longitude } });
  return results[0] ? fromGoogleResult(results[0]) : null;
}

// The address at a position (a dropped pin, the device's location). Google's
// Geocoding when the map is loaded and the API is enabled for the key;
// otherwise, or if it fails, OpenStreetMap's. Throws a GeocodeError.
export async function reverseGeocode(latitude: number, longitude: number): Promise<AddressPlace> {
  try {
    const place = await reverseWithGoogle(latitude, longitude);
    if (place) return place;
  } catch {
    // Not enabled for the key, or down: fall back to OpenStreetMap
  }

  let place: AddressPlace | null;
  try {
    place = await reverseWithNominatim(latitude, longitude);
  } catch {
    throw new GeocodeError("failed");
  }
  if (!place) throw new GeocodeError("notFound");
  return place;
}

// Where a one-line address is, for the tracking map: Google's Geocoding first
// (better with US street addresses), then OpenStreetMap's (geocodeText).
// Throws a GeocodeError.
export async function locateText(address: string): Promise<Coordinates> {
  try {
    const geocoder = await googleGeocoder();
    const location = geocoder ? (await geocoder.geocode({ address })).results[0]?.geometry.location : undefined;
    if (location) return { latitude: location.lat(), longitude: location.lng() };
  } catch {
    // Not enabled for the key, or nothing found: try OpenStreetMap
  }

  return geocodeText(address);
}
