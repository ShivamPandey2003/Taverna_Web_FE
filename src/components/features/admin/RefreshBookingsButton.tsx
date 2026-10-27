import { AngleDown, Refresh2 } from "reicon-react";
import { cn } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBookingListParams } from "@/redux/adminBookings/adminBookingsSlice";
import {
  BOOKINGS_REFRESH_OPTIONS,
  saveBookingsRefresh,
  selectBookingsRefresh,
  setBookingsRefresh,
  type BookingsRefreshSeconds,
} from "@/redux/adminRefresh/adminRefreshSlice";
import { useAdminBookings, useRefreshAdminBookings } from "@/services/queries/adminQueries";

const optionLabel = (seconds: BookingsRefreshSeconds) => (seconds ? `${seconds} seconds` : "Stop");

// The page header's refresh: a button that loads the bookings list (and the
// booking open in the drawer) again now, joined to a dropdown picking how often
// the list does so by itself, with when it last did beside them
export function RefreshBookingsButton() {
  const dispatch = useAppDispatch();
  const { refresh, refreshing } = useRefreshAdminBookings();
  const seconds = useAppSelector(selectBookingsRefresh);
  // The table's own query (same key), for when it last loaded
  const { dataUpdatedAt } = useAdminBookings(useAppSelector(selectBookingListParams));

  const onPick = (value: BookingsRefreshSeconds) => {
    dispatch(setBookingsRefresh(value));
    saveBookingsRefresh(value);
  };

  return (
    <div className="flex items-center gap-3">
      {dataUpdatedAt > 0 && (
        <p className="hidden text-right text-[11px] leading-tight text-gray-500 sm:block">
          Last updated
          <span className="block text-xs font-medium tabular-nums text-gray-700">
            {new Date(dataUpdatedAt).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </p>
      )}

      <div
        className={cn(
          "flex h-9 items-center overflow-hidden rounded-lg border bg-white text-gray-600",
          seconds ? "border-gray-200" : "border-status-pending/40",
        )}
      >
        <button
          data-test-id="bookings-refresh-now"
          type="button"
          onClick={refresh}
          title="Refresh now"
          aria-label="Refresh bookings now"
          className="flex h-full w-9 shrink-0 cursor-pointer items-center justify-center transition hover:bg-gray-100 hover:text-gray-900"
        >
          <Refresh2 size={18} className={cn(refreshing && "animate-spin")} />
        </button>

        <span className="h-5 w-px bg-gray-200" />

        <label className="relative flex h-full items-center">
          <span className="sr-only">Auto refresh</span>
          <select
            data-test-id="bookings-refresh-interval"
            value={seconds}
            onChange={(event) => onPick(Number(event.target.value) as BookingsRefreshSeconds)}
            title={seconds ? `Refreshes every ${seconds} seconds` : "Auto refresh is off"}
            className={cn(
              "h-full cursor-pointer appearance-none bg-transparent pl-3 pr-8 text-sm font-medium outline-none transition hover:bg-gray-100",
              seconds ? "text-gray-900" : "text-[#c2410c]",
            )}
          >
            {BOOKINGS_REFRESH_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {optionLabel(option)}
              </option>
            ))}
          </select>
          <AngleDown size={14} className="pointer-events-none absolute right-2.5 text-gray-500" />
        </label>
      </div>
    </div>
  );
}
