import { AdvancedMarker, Map } from "@vis.gl/react-google-maps";
import { MapArrowSquare, Pin } from "reicon-react";
import { MapMarkerIcon, MapPlaceholder, PanTo } from "@/components/ui/MapParts";
import { useMapsAvailable } from "@/hooks/useMapsAvailable";
import { Spinner } from "@/components/ui/Spinner";
import { DEFAULT_CENTER, GOOGLE_MAP_ID, type LatLng } from "@/libs/maps";

interface AddressMapProps {
  // Where the address is; null until it's known
  pin: LatLng | null;
  // Where to start without a pin, e.g. the customer's default address
  fallbackCenter: LatLng | null;
  // A tap on the map or the pin dragged somewhere: the address comes from there
  onPick: (position: LatLng) => void;
  onUseCurrentLocation: () => void;
  // Getting the device's location or the address at the pin
  busy: boolean;
  disabled: boolean;
  // An address has been picked: the map only shows it until the form is cleared
  readOnly?: boolean;
}

// The Add / Edit Address map: shows where the address is, and picking a spot
// (tap, drag, or the device's location) fills in the form from it
export function AddressMap({
  pin,
  fallbackCenter,
  onPick,
  onUseCurrentLocation,
  busy,
  disabled,
  readOnly = false,
}: AddressMapProps) {
  const available = useMapsAvailable();
  const locked = disabled || busy || readOnly;

  return (
    <div className="relative h-[170px] overflow-hidden rounded-xl bg-gray-100">
      {available ? (
        <Map
          mapId={GOOGLE_MAP_ID}
          defaultCenter={pin ?? fallbackCenter ?? DEFAULT_CENTER}
          defaultZoom={pin ? 16 : fallbackCenter ? 13 : 11}
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          gestureHandling="greedy"
          onClick={(event) => {
            const position = event.detail.latLng;
            if (position && !locked) onPick(position);
          }}
          className="h-full w-full"
        >
          {pin && (
            <AdvancedMarker
              position={pin}
              draggable={!locked}
              onDragEnd={(event) => {
                const position = event.latLng;
                if (position) onPick({ lat: position.lat(), lng: position.lng() });
              }}
            >
              <MapMarkerIcon dark>
                <Pin size={16} />
              </MapMarkerIcon>
            </AdvancedMarker>
          )}
          <PanTo position={pin} />
        </Map>
      ) : (
        <MapPlaceholder message="The map isn't available right now. Search for the address below." />
      )}

      {/* What to do; hidden once there's a pin to drag */}
      {available && !pin && (
        <span className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium text-gray-700 shadow-sm">
          Tap the map to drop a pin
        </span>
      )}

      {!readOnly && (
      <button
        type="button"
        onClick={onUseCurrentLocation}
        disabled={locked}
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white px-3 py-2 text-[10px] font-semibold text-gray-900 shadow-md transition hover:bg-gray-50 disabled:cursor-wait disabled:opacity-80"
      >
        {busy ? <Spinner className="h-3 w-3" /> : <MapArrowSquare size={12} fill="black" />}
        {busy ? "Finding Address..." : "Use My Current Location"}
      </button>
      )}
    </div>
  );
}
