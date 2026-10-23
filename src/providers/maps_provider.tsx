import type { ReactNode } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import { GOOGLE_MAPS_API_KEY, MAPS_ENABLED } from "@/libs/maps";

// Loads Google Maps once for the whole app. Without a key nothing is loaded and
// the maps show their placeholder.
export function MapsProvider({ children }: { children: ReactNode }) {
  if (!MAPS_ENABLED) return children;

  return <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>{children}</APIProvider>;
}
