import { useEffect } from "react";
import { AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { Building, HomeSmile } from "reicon-react";
import { FitPoints, MapMarkerIcon, MapPlaceholder } from "@/components/ui/MapParts";
import { useMapsAvailable } from "@/hooks/useMapsAvailable";
import { DEFAULT_CENTER, GOOGLE_MAP_ID, type LatLng } from "@/libs/maps";

interface TrackingMapProps {
  // The pickup address the customer chose
  pickup: LatLng | null;
  dealership: LatLng | null;
  dealershipName: string;
}

// The trip between the customer's address and the dealership. The valet's live
// position isn't sent by the API yet, so only the two ends are shown.
export function TrackingMap({ pickup, dealership, dealershipName }: TrackingMapProps) {
  const available = useMapsAvailable();
  const points = [pickup, dealership].filter((point): point is LatLng => point !== null);

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

            {pickup && dealership && <DashedLine from={pickup} to={dealership} />}
            <FitPoints points={points} padding={64} />
          </Map>
        )}
      </div>
    </section>
  );
}

// A straight dashed line between the two ends (not the driving route)
function DashedLine({ from, to }: { from: LatLng; to: LatLng }) {
  const map = useMap();
  // The positions are rebuilt on every render; only redraw when they move
  const { lat: fromLat, lng: fromLng } = from;
  const { lat: toLat, lng: toLng } = to;

  useEffect(() => {
    if (!map) return;

    const line = new google.maps.Polyline({
      map,
      path: [
        { lat: fromLat, lng: fromLng },
        { lat: toLat, lng: toLng },
      ],
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

    return () => line.setMap(null);
  }, [map, fromLat, fromLng, toLat, toLng]);

  return null;
}
