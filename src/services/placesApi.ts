import type { Coordinates } from "@/services/geocodeApi";

// One row of the search-as-you-type list: the place's name in bold and where it
// is in grey, as Google Maps shows them
export interface PlaceSuggestion {
  id: string;
  main: string;
  secondary: string;
  // The whole line, shown in the box once the place is picked
  label: string;
  // Photon sends the position with the suggestion; Google's is fetched on pick
  coordinates?: Coordinates;
  prediction?: google.maps.places.PlacePrediction;
}

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

async function suggestWithGoogle(text: string, near: Coordinates | null) {
  const places = await placesLibrary();
  if (!places) return null;

  sessionToken ??= new places.AutocompleteSessionToken();
  const { suggestions } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: text,
    sessionToken,
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

async function suggestWithPhoton(text: string, near: Coordinates | null, signal?: AbortSignal) {
  const query = new URLSearchParams({ q: text, limit: "5", lang: "en" });
  if (near) {
    query.set("lat", String(near.latitude));
    query.set("lon", String(near.longitude));
  }

  const response = await fetch(`https://photon.komoot.io/api/?${query}`, { signal });
  if (!response.ok) throw new Error(`Place search answered ${response.status}`);
  const { features } = (await response.json()) as { features: PhotonFeature[] };

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
    };
  });
}

// Places matching what's been typed, closest to `near` first when it's known.
// Google's Places Autocomplete when the Maps script is loaded and the Places API
// (New) is enabled for the key; otherwise, or if it fails, Photon's.
export async function suggestPlaces(
  text: string,
  near: Coordinates | null,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  try {
    const suggestions = await suggestWithGoogle(text, near);
    if (suggestions) return suggestions;
  } catch {
    // Not enabled for the key, or down: fall back to Photon
  }

  return suggestWithPhoton(text, near, signal);
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
