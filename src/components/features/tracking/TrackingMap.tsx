import { useEffect, useState } from "react";
import { AdvancedMarker, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { Building, HomeSmile } from "reicon-react";
import { FitPoints, MapMarkerIcon, MapPlaceholder } from "@/components/ui/MapParts";
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
      lines = [dashedLine(map, origin, destination)];
      onSummary({ miles: straightMiles(origin, destination), minutes: null, byRoad: false });
    };

    routes.Route.computeRoutes({
      origin,
      destination,
      travelMode: "DRIVING",
      fields: ["path", "distanceMeters", "durationMillis"],
    })
      .then(({ routes: found }) => {
        if (cancelled) return;
        const route = found?.[0];
        if (!route?.path?.length || route.distanceMeters == null) {
          drawStraight();
          return;
        }

        lines = [
          new google.maps.Polyline({
            map,
            path: route.path.map((point) => ({ lat: point.lat, lng: point.lng })),
            strokeColor: "#111827",
            strokeOpacity: 0.85,
            strokeWeight: 5,
          }),
        ];
        onSummary({
          miles: route.distanceMeters / METERS_PER_MILE,
          minutes: route.durationMillis ? Math.round(route.durationMillis / 60000) : null,
          byRoad: true,
        });
      })
      .catch(() => {
        // Usually the Routes API not being enabled for the key
        if (!cancelled) drawStraight();
      });

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
