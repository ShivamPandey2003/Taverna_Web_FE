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
import { SearchInput } from "./SearchInput";

export function BookingsToolbar() {
  const dispatch = useAppDispatch();
  const { search, status, serviceId } = useAppSelector(selectBookingListParams);

  const hasFilters = search !== "" || status !== "all" || serviceId !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={search}
        onSearch={(value) => dispatch(setSearch(value))}
        placeholder="Search by booking ID, customer, email, phone or VIN"
      />

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
          onClick={() => dispatch(resetFilters())}
          className="h-9 rounded-lg px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
