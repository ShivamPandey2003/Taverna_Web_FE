import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/auth/authSlice";

// Clears the session, the account's Redux data and any cached API responses
export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return () => {
    dispatch(logout());
    queryClient.clear();
    navigate("/", { replace: true });
  };
}
