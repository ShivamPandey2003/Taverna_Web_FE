import { useEffect, type ReactNode } from "react";
import { Navigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectSession, setAuthMode } from "@/redux/auth/authSlice";
import { openAuthModal } from "@/redux/modals/homeModal/homeModalSlice";
import type { UserRole } from "@/types/auth";

// Where each role lands when it opens the other role's pages
const roleHomePaths: Record<UserRole, string> = {
  user: "/dashboard",
  admin: "/admin",
};

interface RequireAuthProps {
  // Omit to allow any logged-in account
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

  // Customers can't open admin pages and admins can't open customer pages
  if (role && session.user.role !== role) {
    return <Navigate to={roleHomePaths[session.user.role]} replace />;
  }

  return children;
}
