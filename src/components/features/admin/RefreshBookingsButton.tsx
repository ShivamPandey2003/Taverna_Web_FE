import { Refresh2 } from "reicon-react";
import { cn } from "@/libs/utils";
import { useRefreshAdminBookings } from "@/services/queries/adminQueries";

// Loads the bookings list (and the booking open in the drawer) again. The list
// also does so by itself every 5s; the icon spins while it does.
export function RefreshBookingsButton() {
  const { refresh, refreshing } = useRefreshAdminBookings();

  return (
    <button
      type="button"
      onClick={refresh}
      title="Refresh bookings"
      aria-label="Refresh bookings"
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
    >
      <Refresh2 size={18} className={cn(refreshing && "animate-spin")} />
    </button>
  );
}
