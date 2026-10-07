import { useSearchParams } from "react-router";
import type { StaffAuth } from "@/types/admin";

// The staff pages' sign-in lives in the URL's search params: `gear` (the auth
// token) and `token` (the encrypted staff type). A link from the admin already
// carries both; without them the page shows StaffLogin, which writes them here.
// The app's own session (localStorage) is never involved.
export function useStaffAuth() {
  const [params, setParams] = useSearchParams();
  const auth: StaffAuth = { gear: params.get("gear") ?? "", token: params.get("token") ?? "" };

  return {
    auth,
    signedIn: !!auth.gear && !!auth.token,
    signIn: (next: StaffAuth) =>
      setParams({ gear: next.gear, token: next.token }, { replace: true }),
    // Back to the email + OTP form
    signOut: () => setParams({}, { replace: true }),
  };
}
