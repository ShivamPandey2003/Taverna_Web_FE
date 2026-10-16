import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/auth/authSlice";
import { useLogoutRequest } from "@/services/queries/authQueries";
import { pendingBookingStorage } from "@/services/pendingBookingStorage";

// Revokes the session on the server, then clears the session, the account's
// Redux data and any cached API responses
export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutRequest = useLogoutRequest();

  return () => {
    if (logoutRequest.isPending) return;

    // The request needs the access token, so the local session is cleared only
    // once it's back. A failed request (offline, token already expired) still
    // logs out here.
    logoutRequest.mutate(undefined, {
      onSettled: () => {
        dispatch(logout());
        queryClient.clear();
        // The landing page's choice belonged to this account's visit
        pendingBookingStorage.clear();
        navigate("/", { replace: true });
      },
    });
  };
}
