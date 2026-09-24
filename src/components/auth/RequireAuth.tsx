import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectSession, setAuthMode } from "@/redux/auth/authSlice";
import { openAuthModal } from "@/redux/modals/homeModal/homeModalSlice";
import type { UserRole } from "@/types/auth";

interface RequireAuthProps {
  // Omit to allow any logged-in account. Admins can open every user page too.
  role?: UserRole;
  children: ReactNode;
}

export function RequireAuth({ role, children }: RequireAuthProps) {
  const dispatch = useAppDispatch();
  const session = useAppSelector(selectSession);

  // Send logged-out visitors to the landing page with the login modal open
  useEffect(() => {
    if (!session) {
      dispatch(setAuthMode("login"));
      dispatch(openAuthModal());
    }
  }, [dispatch, session]);

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (role === "admin" && session.user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
