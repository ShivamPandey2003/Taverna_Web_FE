import { Outlet } from "react-router";

import { Navbar } from "@/components/global/Navbar";
import { ServiceStatusToast } from "@/components/features/tracking/ServiceStatusToast";
import { useSyncActiveBookings } from "@/components/features/tracking/serviceStatus";
import { usePendingBooking } from "@/hooks/usePendingBooking";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSyncAddresses } from "@/hooks/useSyncAddresses";
import { useSyncProfile } from "@/hooks/useSyncProfile";
import { useSyncVehicles } from "@/hooks/useSyncVehicles";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin } from "@/redux/auth/authSlice";

export function DashboardLayout() {
  const isAdmin = useAppSelector(selectIsAdmin);
  // Bring back a customer's unfinished bookings after a reload
  useSyncActiveBookings(!isAdmin);
  // Customers' saved vehicles, for every dashboard page
  useSyncVehicles(!isAdmin);
  // And their saved addresses
  useSyncAddresses(!isAdmin);
  // And their profile, which the login only gives part of
  useSyncProfile(!isAdmin);
  // The pickup and dealership picked on the landing page before signing in
  usePendingBooking(!isAdmin);
  // Push notifications in this browser, and pushes arriving while it's open
  usePushNotifications(!isAdmin);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />

      {/* Page Content; both roles navigate from the Navbar. Each page scrolls
          itself and ends with room for the status bubbles (status-bubble-space) */}
      <main className="status-bubble-space min-h-0 min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Customers see their running service on every dashboard page */}
      {!isAdmin && <ServiceStatusToast />}
    </div>
  );
}