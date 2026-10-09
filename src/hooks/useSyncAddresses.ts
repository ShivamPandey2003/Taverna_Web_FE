import { useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { setAddresses } from "@/redux/address/addressSlice";
import { useAddresses } from "@/services/queries/addressQueries";

// Keeps the Redux address list in step with the customer's saved addresses on the
// server, so every dashboard page (and the booking selectors) can read them
export function useSyncAddresses(enabled: boolean) {
  const dispatch = useAppDispatch();
  const { data: addresses } = useAddresses(enabled);

  useEffect(() => {
    if (enabled && addresses) {
      dispatch(setAddresses(addresses));
    }
  }, [dispatch, enabled, addresses]);
}
