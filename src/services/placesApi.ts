import type { AddressPlace, Coordinates } from "@/services/geocodeApi";
import { toStateCode } from "@/libs/usStates";

// What to suggest: any place (the landing page's pickup), or one part of an
// address for the address form's fields
export type PlaceKind = "any" | "address" | "city" | "postalCode";

// One row of the search-as-you-type list: the place's name in bold and where it
// is in grey, as Google Maps shows them
export interface PlaceSuggestion {
  id: string;
  main: string;
  secondary: string;
  // The whole line, shown in the box once the place is picked
  label: string;
  // Photon sends the position and the address's parts with the suggestion;
  // Google's are fetched on pick
  coordinates?: Coordinates;
  parts?: AddressPlace;
  prediction?: google.maps.places.PlacePrediction;
}

// Google's place types for each kind (Places API (New), at most five)
const googleTypes: Record<Exclude<PlaceKind, "any">, string[]> = {
  address: ["street_address", "premise", "subpremise", "route"],
  city: ["(cities)"],
  postalCode: ["postal_code"],
};

// Photon's layers for each kind; postal codes have none, so any place is searched
// and its postcode taken
const photonLayers: Partial<Record<PlaceKind, string[]>> = {
  address: ["house", "street"],
  city: ["city", "locality"],
};

// Google's Places library once the Maps script has loaded (the types assume it
// always has); null before then, without a key, or when it fails to load
async function placesLibrary() {
  const maps =
    typeof google === "undefined" ? undefined : (google.maps as Partial<typeof google.maps> | undefined);
  if (!maps?.importLibrary) return null;
  return (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
}

// One Google billing session runs from the first keystroke to the pick
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

async function suggestWithGoogle(text: string, near: Coordinates | null, kind: PlaceKind) {
  const places = await placesLibrary();
  if (!places) return null;

  sessionToken ??= new places.AutocompleteSessionToken();
  const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: text,
    sessionToken,
    ...(kind !== "any" && { includedPrimaryTypes: googleTypes[kind] }),
    ...(near && {
      locationBias: { center: { lat: near.latitude, lng: near.longitude }, radius: 50000 },
    }),
  });

  return suggestions.flatMap(({ placePrediction: prediction }): PlaceSuggestion[] =>
    prediction
      ? [
          {
            id: prediction.placeId,
            main: prediction.mainText?.text ?? prediction.text.text,
            secondary: prediction.secondaryText?.text ?? "",
            label: prediction.text.text,
            prediction,
          },
        ]
      : [],
  );
}

// Photon: OpenStreetMap data, built for search-as-you-type, no key
interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: Partial<
    Record<"osm_id" | "name" | "housenumber" | "street" | "district" | "city" | "state" | "country" | "postcode", string>
  >;
}

async function suggestWithPhoton(
  text: string,
  near: Coordinates | null,
  kind: PlaceKind,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ q: text, limit: kind === "postalCode" ? "10" : "5", lang: "en" });
  if (near) {
    query.set("lat", String(near.latitude));
    query.set("lon", String(near.longitude));
  }
  photonLayers[kind]?.forEach((layer) => query.append("layer", layer));

  const response = await fetch(`https://photon.komoot.io/api/?${query}`, { signal });
  if (!response.ok) throw new Error(`Place search answered ${response.status}`);
  const { features } = (await response.json()) as { features: PhotonFeature[] };

  const toParts = (place: PhotonFeature["properties"]): AddressPlace => ({
    address: [place.housenumber, place.street].filter(Boolean).join(" ") || place.name || "",
    city: place.city ?? "",
    state: toStateCode(place.state ?? ""),
    zip: place.postcode ?? "",
  });

  // One row per postcode, with where it is
  if (kind === "postalCode") {
    const seen = new Set<string>();
    return features.flatMap(({ geometry, properties: place }): PlaceSuggestion[] => {
      const zip = place.postcode;
      if (!zip || seen.has(zip) || !zip.toLowerCase().startsWith(text.trim().toLowerCase())) return [];
      seen.add(zip);
      const secondary = [place.city, place.state, place.country].filter(Boolean).join(", ");
      return [
        {
          id: zip,
          main: zip,
          secondary,
          label: [zip, secondary].filter(Boolean).join(", "),
          coordinates: { latitude: geometry.coordinates[1], longitude: geometry.coordinates[0] },
          parts: { ...toParts(place), address: "" },
        },
      ];
    });
  }

  return features.map(({ geometry, properties: place }, index): PlaceSuggestion => {
    const street = [place.housenumber, place.street].filter(Boolean).join(" ");
    const main = place.name || street || place.city || text;
    const secondary = [
      place.name && street !== main ? street : "",
      place.district,
      place.city !== main ? place.city : "",
      [place.state, place.postcode].filter(Boolean).join(" "),
      place.country,
    ]
      .filter(Boolean)
      .join(", ");

    return {
      id: `${place.osm_id ?? index}-${index}`,
      main,
      secondary,
      label: [main, secondary].filter(Boolean).join(", "),
      coordinates: { latitude: geometry.coordinates[1], longitude: geometry.coordinates[0] },
      parts: toParts(place),
    };
  });
}

// Places matching what's been typed, closest to `near` first when it's known;
// `kind` narrows them to addresses, cities or postal codes.
// Google's Places Autocomplete when the Maps script is loaded and the Places API
// (New) is enabled for the key; otherwise, or if it fails, Photon's.
export async function suggestPlaces(
  text: string,
  near: Coordinates | null,
  signal?: AbortSignal,
  kind: PlaceKind = "any",
): Promise<PlaceSuggestion[]> {
  try {
    const suggestions = await suggestWithGoogle(text, near, kind);
    if (suggestions) return suggestions;
  } catch {
    // Not enabled for the key, or down: fall back to Photon
  }

  return suggestWithPhoton(text, near, kind, signal);
}

// Where a picked suggestion is and its address's parts (street, city, state as
// its code, ZIP), for filling in the address form. Ends Google's billing session.
export async function placeDetails(
  suggestion: PlaceSuggestion,
): Promise<{ coordinates: Coordinates; place: AddressPlace }> {
  if (suggestion.coordinates && suggestion.parts) {
    return { coordinates: suggestion.coordinates, place: suggestion.parts };
  }

  sessionToken = null;
  const result = suggestion.prediction!.toPlace();
  await result.fetchFields({ fields: ["location", "addressComponents"] });
  if (!result.location) throw new Error("Place has no location");

  const components = result.addressComponents ?? [];
  const part = (type: string, short = false) => {
    const component = components.find((item) => item.types.includes(type));
    return (short ? component?.shortText : component?.longText) ?? "";
  };

  return {
    coordinates: { latitude: result.location.lat(), longitude: result.location.lng() },
    place: {
      address: [part("street_number"), part("route")].filter(Boolean).join(" ") || part("premise"),
      city: part("locality") || part("postal_town") || part("sublocality") || part("administrative_area_level_2"),
      state: part("administrative_area_level_1", true),
      zip: part("postal_code"),
    },
  };
}

// Where a picked suggestion is. Ends Google's billing session.
export async function placeCoordinates(suggestion: PlaceSuggestion): Promise<Coordinates> {
  if (suggestion.coordinates) return suggestion.coordinates;

  sessionToken = null;
  const place = suggestion.prediction!.toPlace();
  await place.fetchFields({ fields: ["location"] });
  if (!place.location) throw new Error("Place has no location");
  return { latitude: place.location.lat(), longitude: place.location.lng() };
}
