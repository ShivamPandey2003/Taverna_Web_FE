import { useEffect, useState } from "react";
import { AdvancedMarker, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Building, HomeSmile } from "reicon-react";
import { FitPoints, MapErrorBoundary, MapMarkerIcon, MapPlaceholder } from "@/components/ui/MapParts";
import { useMapsAvailable } from "@/hooks/useMapsAvailable";
import { DEFAULT_CENTER, GOOGLE_MAP_ID, type LatLng } from "@/libs/maps";

interface TrackingMapProps {
  // The pickup address the customer chose
  pickup: LatLng | null;
  dealership: LatLng | null;
  dealershipName: string;
  // The pickup address couldn't be placed on the map
  pickupMissing: boolean;
}

// How far the trip is: by road when Google's Routes API answers, otherwise in a
// straight line
interface TripSummary {
  miles: number;
  minutes: number | null;
  byRoad: boolean;
}

// The trip between the customer's address and the dealership, with the driving
// route and its distance. The valet's live position isn't sent by the API yet,
// so only the two ends are shown.
export function TrackingMap({ pickup, dealership, dealershipName, pickupMissing }: TrackingMapProps) {
  const available = useMapsAvailable();
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const points = [pickup, dealership].filter((point): point is LatLng => point !== null);
  const bothEnds = pickup && dealership;

  return (
    <section className="bg-[#f5f5f5] p-5">
      <div className="relative h-[320px] overflow-hidden rounded-2xl bg-[#e7e7e7]">
        {!available ? (
          <MapPlaceholder message="The map isn't available right now." />
        ) : points.length === 0 ? (
          <MapPlaceholder message="Finding your pickup address and the dealership..." />
        ) : (
          <MapErrorBoundary>
          <Map
            mapId={GOOGLE_MAP_ID}
            defaultCenter={points[0] ?? DEFAULT_CENTER}
            defaultZoom={13}
            disableDefaultUI
            zoomControl
            clickableIcons={false}
            gestureHandling="cooperative"
            className="h-full w-full"
          >
            {pickup && (
              <AdvancedMarker position={pickup} title="Your pickup address">
                <MapMarkerIcon>
                  <HomeSmile size={18} strokeWidth={2.5} />
                </MapMarkerIcon>
              </AdvancedMarker>
            )}

            {dealership && (
              <AdvancedMarker position={dealership} title={dealershipName}>
                <MapMarkerIcon dark>
                  <Building size={17} strokeWidth={2.5} />
                </MapMarkerIcon>
              </AdvancedMarker>
            )}

            {bothEnds && <TripRoute from={pickup} to={dealership} onSummary={setSummary} />}
            <FitPoints points={points} padding={64} />
          </Map>
          </MapErrorBoundary>
        )}

        {/* Distance and drive time, over the map's top-left corner */}
        {available && bothEnds && summary && (
          <div className="absolute left-3 top-3 rounded-xl bg-white px-3.5 py-2.5 shadow-md">
            <p className="text-sm font-bold text-gray-900">
              {formatMiles(summary.miles)}
              {summary.minutes != null && (
                <span className="font-medium text-gray-500"> · {formatMinutes(summary.minutes)}</span>
              )}
            </p>
            <p className="mt-0.5 max-w-[220px] truncate text-xs text-gray-500">
              {summary.byRoad ? "Drive to" : "Straight-line distance to"} {dealershipName}
            </p>
          </div>
        )}

        {available && pickupMissing && dealership && (
          <p className="absolute left-3 top-3 max-w-[260px] rounded-xl bg-white px-3.5 py-2.5 text-xs text-gray-600 shadow-md">
            We couldn't place your pickup address on the map, so only the dealership is shown.
          </p>
        )}
      </div>
    </section>
  );
}

// The driving route from the pickup to the dealership (Google's Routes API). If
// that isn't enabled for the key, or finds no route: a dashed straight line.
function TripRoute({
  from,
  to,
  onSummary,
}: {
  from: LatLng;
  to: LatLng;
  onSummary: (summary: TripSummary) => void;
}) {
  const map = useMap();
  const routes = useMapsLibrary("routes");
  // The positions are rebuilt on every render; only route again when they move
  const { lat: fromLat, lng: fromLng } = from;
  const { lat: toLat, lng: toLng } = to;

  useEffect(() => {
    if (!map || !routes) return;

    const origin = { lat: fromLat, lng: fromLng };
    const destination = { lat: toLat, lng: toLng };
    let cancelled = false;
    let lines: google.maps.Polyline[] = [];

    const drawStraight = () => {
      try {
        lines = [dashedLine(map, origin, destination)];
      } catch {
        // Nothing drawn; the distance card still shows
      }
      onSummary({ miles: straightMiles(origin, destination), minutes: null, byRoad: false });
    };

    const drawRoute = (path: LatLng[], meters: number, millis: number | null) => {
      lines = [
        new google.maps.Polyline({
          map,
          path,
          strokeColor: "#111827",
          strokeOpacity: 0.85,
          strokeWeight: 5,
        }),
      ];
      onSummary({
        miles: meters / METERS_PER_MILE,
        minutes: millis ? Math.round(millis / 60000) : null,
        byRoad: true,
      });
    };

    // Google's Routes API (needs "Routes API" enabled for the key)
    const viaRoutesApi = async () => {
      if (typeof routes.Route?.computeRoutes !== "function") return null;
      const { routes: found } = await routes.Route.computeRoutes({
        origin,
        destination,
        travelMode: "DRIVING",
        fields: ["path", "distanceMeters", "durationMillis"],
      });
      const route = found?.[0];
      if (!route?.path?.length || route.distanceMeters == null) return null;
      return {
        path: route.path.map((point) => ({ lat: point.lat, lng: point.lng })),
        meters: route.distanceMeters,
        millis: route.durationMillis ?? null,
      };
    };

    // The older Directions service (needs "Directions API" enabled for the key)
    const viaDirections = async () => {
      if (typeof routes.DirectionsService !== "function") return null;
      const result = await new routes.DirectionsService().route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });
      const route = result.routes?.[0];
      const leg = route?.legs?.[0];
      if (!route?.overview_path?.length || leg?.distance?.value == null) return null;
      return {
        path: route.overview_path.map((point) => ({ lat: point.lat(), lng: point.lng() })),
        meters: leg.distance.value,
        millis: leg.duration?.value != null ? leg.duration.value * 1000 : null,
      };
    };

    // Each way is tried in turn; whatever fails (an API not enabled, no route
    // found) falls through to the next, and a straight line is the last resort
    const attempt = async (find: () => Promise<{ path: LatLng[]; meters: number; millis: number | null } | null>) => {
      try {
        return await find();
      } catch {
        return null;
      }
    };

    void (async () => {
      const found = (await attempt(viaRoutesApi)) ?? (await attempt(viaDirections));
      if (cancelled) return;
      if (!found) {
        drawStraight();
        return;
      }
      try {
        drawRoute(found.path, found.meters, found.millis);
      } catch {
        drawStraight();
      }
    })();

    return () => {
      cancelled = true;
      lines.forEach((line) => line.setMap(null));
    };
  }, [map, routes, fromLat, fromLng, toLat, toLng, onSummary]);

  return null;
}

const METERS_PER_MILE = 1609.344;

function dashedLine(map: google.maps.Map, from: LatLng, to: LatLng) {
  return new google.maps.Polyline({
    map,
    path: [from, to],
    geodesic: true,
    // The line itself is invisible; its dashes are repeated symbols
    strokeOpacity: 0,
    icons: [
      {
        icon: { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: "#111827", scale: 3 },
        offset: "0",
        repeat: "14px",
      },
    ],
  });
}

// As the crow flies (haversine), in miles
function straightMiles(from: LatLng, to: LatLng) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to.lat - from.lat);
  const dLng = radians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatMiles(miles: number) {
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
