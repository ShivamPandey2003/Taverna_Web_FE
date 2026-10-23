import { Component, useEffect, type ReactNode } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/libs/maps";
import { cn } from "@/libs/utils";

export function MapPlaceholder({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gray-100 px-6 text-center text-xs text-gray-500",
        className,
      )}
    >
      {message}
    </div>
  );
}

// Google's map code can throw inside React (e.g. AdvancedMarker failing with a
// map ID the key can't use), which would take the whole page down. This keeps
// the failure to the map: it shows the placeholder instead.
export class MapErrorBoundary extends Component<
  { message?: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Map failed to render", error);
  }

  render() {
    if (this.state.failed) {
      return <MapPlaceholder message={this.props.message ?? "The map isn't available right now."} />;
    }
    return this.props.children;
  }
}

// Our round marker: an icon on white, for AdvancedMarker's content
export function MapMarkerIcon({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full shadow-md ring-2 ring-white",
        dark ? "bg-gray-900 text-white" : "bg-white text-gray-900",
      )}
    >
      {children}
    </div>
  );
}

// Moves the map to a position whenever it changes (the map's own centre is only
// its starting point)
export function PanTo({ position, zoom }: { position: LatLng | null; zoom?: number }) {
  const map = useMap();
  const lat = position?.lat;
  const lng = position?.lng;

  useEffect(() => {
    if (!map || lat == null || lng == null) return;
    map.panTo({ lat, lng });
    if (zoom) map.setZoom(zoom);
  }, [map, lat, lng, zoom]);

  return null;
}

// Fits every point in view; a single point is centred at street level
export function FitPoints({ points, padding = 56 }: { points: LatLng[]; padding?: number }) {
  const map = useMap();
  // One string, so the effect only runs when a point actually moves
  const key = points.map((point) => `${point.lat},${point.lng}`).join("|");

  useEffect(() => {
    if (!map || !key) return;
    const positions = key.split("|").map((pair) => {
      const [lat, lng] = pair.split(",").map(Number);
      return { lat, lng };
    });

    if (positions.length === 1) {
      map.setCenter(positions[0]);
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    positions.forEach((position) => bounds.extend(position));
    map.fitBounds(bounds, padding);
  }, [map, key, padding]);

  return null;
}
