import { useSyncExternalStore } from "react";
import { staffAuthStorage } from "@/services/staffAuthStorage";
import type { StaffAuth } from "@/types/admin";

// The staff pages' sign-in: `gear` (the auth token) and `token` (the staff
// type), kept in localStorage (staffAuthStorage). Without a stored sign-in the
// page shows StaffLogin (email + OTP), which stores one. The app's own session
// is never involved.
export function useStaffAuth() {
  const stored = staffAuthStorage.parse(
    useSyncExternalStore(staffAuthStorage.subscribe, staffAuthStorage.read),
  );

  const auth: StaffAuth = stored ?? { gear: "", token: "" };

  return {
    auth,
    signedIn: !!auth.gear && !!auth.token,
    signIn: (next: StaffAuth) => staffAuthStorage.save(next),
    // Back to the email + OTP form
    signOut: () => staffAuthStorage.clear(),
  };
}
