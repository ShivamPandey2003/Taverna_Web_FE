// Google Maps settings, read from .env. The key ends up in the browser, so it
// must be restricted in Google Cloud Console (HTTP referrers + only the APIs the
// app uses: Maps JavaScript, Geocoding).
export const GOOGLE_MAPS_API_KEY: string =
  import.meta.env.VITE_REACT_APP_GOOGLE_MAP_API_KEY?.trim() ?? "";

// Our own marker icons (AdvancedMarker) need a map ID. Google's demo ID works
// until the project has its own (Map Management in the console).
export const GOOGLE_MAP_ID: string = import.meta.env.VITE_GOOGLE_MAP_ID?.trim() || "DEMO_MAP_ID";

// Without a key the maps show a plain placeholder instead
export const MAPS_ENABLED = GOOGLE_MAPS_API_KEY !== "";

export interface LatLng {
  lat: number;
  lng: number;
}

// Where a map with nothing to show yet starts: Fort Lauderdale, where the
// dealerships are
export const DEFAULT_CENTER: LatLng = { lat: 26.1224, lng: -80.1373 };

// A usable position from an address's or a dealership's coordinates. 0 / 0 is
// what a booking restored from the list has when it doesn't know them.
export function toLatLng(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): LatLng | null {
  if (latitude == null || longitude == null) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;
  return { lat: latitude, lng: longitude };
}

// The device's position, for "Use My Current Location"
export function getDevicePosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Your browser can't share its location."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      (error) =>
        reject(
          new Error(
            error.code === error.PERMISSION_DENIED
              ? "Location permission was denied."
              : error.code === error.TIMEOUT
                ? "Getting your location took too long. Try again."
                : "We couldn't get your location.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}
