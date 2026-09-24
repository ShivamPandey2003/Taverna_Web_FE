import { useEffect, useState } from "react";
import { Search } from "reicon-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  resetFilters,
  selectBookingListParams,
  setSearch,
  setServiceFilter,
  setStatusFilter,
} from "@/redux/adminBookings/adminBookingsSlice";
import type { BookingListParams } from "@/types/admin";
import { bookingStatuses, serviceLabels } from "./admin.utils";

const SEARCH_DEBOUNCE_MS = 400;

export function BookingsToolbar() {
  const dispatch = useAppDispatch();
  const { search, status, serviceId } = useAppSelector(selectBookingListParams);

  // The input updates immediately; the API search waits until typing pauses
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    if (searchInput === search) return;

    const timer = setTimeout(() => {
      dispatch(setSearch(searchInput));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [dispatch, search, searchInput]);

  const hasFilters = search !== "" || status !== "all" || serviceId !== "all";

  const handleReset = () => {
    setSearchInput("");
    dispatch(resetFilters());
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative min-w-[260px] flex-1">
        <Search
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by booking ID, customer, email, phone or VIN"
          className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
        />
      </div>

      {/* Status */}
      <select
        value={status}
        onChange={(event) =>
          dispatch(setStatusFilter(event.target.value as BookingListParams["status"]))
        }
        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        {bookingStatuses.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {/* Service */}
      <select
        value={serviceId}
        onChange={(event) =>
          dispatch(setServiceFilter(event.target.value as BookingListParams["serviceId"]))
        }
        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
        aria-label="Filter by service"
      >
        <option value="all">All services</option>
        {Object.entries(serviceLabels).map(([id, label]) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={handleReset}
          className="h-9 rounded-lg px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
