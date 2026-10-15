import { APILoadingStatus, useApiLoadingStatus } from "@vis.gl/react-google-maps";
import { MAPS_ENABLED } from "@/libs/maps";

// False when there's no key, or Google refused it (wrong key, this site not
// allowed for it): the maps then show MapPlaceholder instead
export function useMapsAvailable() {
  // "Not loaded" outside the provider, which only exists when the key is set
  const status = useApiLoadingStatus();
  const refused = status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE;
  return MAPS_ENABLED && !refused;
}
