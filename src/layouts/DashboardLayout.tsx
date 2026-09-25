import { Outlet } from "react-router";

import { Navbar } from "@/components/global/Navbar";
import { Sidebar } from "@/components/global/Sidebar";
import { ServiceStatusToast } from "@/components/features/tracking/ServiceStatusToast";
import { useSyncActiveBooking } from "@/components/features/tracking/serviceStatus";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin } from "@/redux/auth/authSlice";

export function DashboardLayout() {
  const isAdmin = useAppSelector(selectIsAdmin);
  // Bring back a customer's unfinished booking after a reload
  useSyncActiveBooking(!isAdmin);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        {/* Page Content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* Customers see their running service on every dashboard page */}
      {!isAdmin && <ServiceStatusToast />}
    </div>
  );
}