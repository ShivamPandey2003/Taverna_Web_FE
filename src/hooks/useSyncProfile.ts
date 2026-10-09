import { useEffect } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { updateProfile } from "@/redux/account/accountSlice";
import { profileName } from "@/services/profileApi";
import { useProfile } from "@/services/queries/profileQueries";

// Keeps the Redux profile (and with it the stored session) in step with the
// customer's profile on the server; until it loads, the name, email and phone
// from the login are shown
export function useSyncProfile(enabled: boolean) {
  const dispatch = useAppDispatch();
  const { data: profile } = useProfile(enabled);

  useEffect(() => {
    if (enabled && profile) {
      dispatch(
        updateProfile({
          // An account with no name yet keeps the one from the login
          ...(profileName(profile) && { name: profileName(profile) }),
          email: profile.email,
          phone: profile.phone,
        }),
      );
    }
  }, [dispatch, enabled, profile]);
}
