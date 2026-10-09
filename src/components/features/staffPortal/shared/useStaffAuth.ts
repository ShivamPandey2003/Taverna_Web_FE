import { useEffect, useSyncExternalStore } from "react";
import { useSearchParams } from "react-router";
import { staffAuthStorage } from "@/services/staffAuthStorage";
import type { StaffAuth } from "@/types/admin";

// The staff pages' sign-in: `gear` (the auth token) and `token` (the encrypted
// staff type), kept in localStorage (staffAuthStorage). A link from the admin
// carries both as search params: they're stored on arrival and taken out of the
// URL. Without a stored sign-in the page shows StaffLogin, which stores one.
// The app's own session is never involved.
export function useStaffAuth() {
  const [params, setParams] = useSearchParams();
  const stored = staffAuthStorage.parse(
    useSyncExternalStore(staffAuthStorage.subscribe, staffAuthStorage.read),
  );

  const linkGear = params.get("gear") ?? "";
  const linkToken = params.get("token") ?? "";
  const fromLink = !!linkGear && !!linkToken;

  // A shared link signs its holder in: keep it, then clean the address bar
  useEffect(() => {
    if (!fromLink) return;
    staffAuthStorage.save({ gear: linkGear, token: linkToken });
    setParams(
      (current) => {
        current.delete("gear");
        current.delete("token");
        return current;
      },
      { replace: true },
    );
  }, [fromLink, linkGear, linkToken, setParams]);

  // The link's own sign-in wins on the render before it's stored
  const auth: StaffAuth = fromLink
    ? { gear: linkGear, token: linkToken }
    : (stored ?? { gear: "", token: "" });

  return {
    auth,
    signedIn: !!auth.gear && !!auth.token,
    signIn: (next: StaffAuth) => staffAuthStorage.save(next),
    // Back to the email + OTP form
    signOut: () => staffAuthStorage.clear(),
  };
}
