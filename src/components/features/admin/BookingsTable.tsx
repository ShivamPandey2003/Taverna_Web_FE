import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectBookingListParams,
  setPage,
  setPageSize,
  toggleSort,
} from "@/redux/adminBookings/adminBookingsSlice";
import {
  openBookingDetails,
  openBookingWorkflow,
} from "@/redux/modals/adminModal/adminModalSlice";
import { useAdminBookings } from "@/services/queries/adminQueries";
import type { BookingSortField } from "@/types/admin";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { SortButton } from "./SortButton";
import { TablePagination } from "./TablePagination";
import { formatShortDateTime, serviceLabels } from "./admin.utils";

const columns: { label: string; sortField?: BookingSortField }[] = [
  { label: "Booking ID", sortField: "id" },
  { label: "Customer", sortField: "customer" },
  { label: "Vehicle" },
  { label: "Service" },
  { label: "Created", sortField: "createdAt" },
  { label: "Scheduled", sortField: "scheduledAt" },
  { label: "Status", sortField: "status" },
  { label: "Actions" },
];

export function BookingsTable() {
  const dispatch = useAppDispatch();
  const params = useAppSelector(selectBookingListParams);
  const { data, isPending, isError, isFetching, refetch } = useAdminBookings(params);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="relative overflow-x-auto">
        {/* Thin bar while a new page / sort / search loads over the current rows */}
        {isFetching && !isPending && (
          <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-emerald-500" />
        )}

        <table className="w-full min-w-[960px] text-left text-[13px]">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((column) => (
                <th key={column.label} className="whitespace-nowrap px-4 py-2.5">
                  {column.sortField ? (
                    <SortButton
                      label={column.label}
                      active={params.sortBy === column.sortField}
                      order={params.sortOrder}
                      onClick={() => dispatch(toggleSort(column.sortField!))}
                    />
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isPending &&
              Array.from({ length: params.pageSize }, (_, index) => (
                <tr key={index}>
                  <td colSpan={columns.length} className="px-4 py-2">
                    <div className="h-5 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))}

            {isError && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center">
                  <p className="text-sm text-gray-500">Couldn't load bookings.</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Try again
                  </button>
                </td>
              </tr>
            )}

            {data?.items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-gray-500">
                  No bookings match your search or filters.
                </td>
              </tr>
            )}

            {data?.items.map((booking) => (
              <tr
                key={booking.id}
                onClick={() => dispatch(openBookingDetails(booking.id))}
                className="cursor-pointer transition hover:bg-gray-50"
              >
                {/* One line per row; the full details are in the booking modal */}
                <td className="whitespace-nowrap px-4 py-2 font-semibold text-gray-900">
                  {booking.id}
                </td>

                <td
                  className="max-w-[200px] truncate px-4 py-2 font-medium text-gray-900"
                  title={`${booking.customer.name} · ${booking.customer.email}`}
                >
                  {booking.customer.name}
                </td>

                <td
                  className="max-w-[220px] truncate px-4 py-2 text-gray-900"
                  title={`VIN ${booking.vehicle.vin}`}
                >
                  {booking.vehicle.year} {booking.vehicle.brand} {booking.vehicle.model}
                </td>

                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {serviceLabels[booking.serviceId]}
                </td>

                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {formatShortDateTime(booking.createdAt)}
                </td>

                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {booking.scheduledAt ? formatShortDateTime(booking.scheduledAt) : "ASAP"}
                </td>

                <td className="px-4 py-2">
                  <BookingStatusBadge status={booking.status} />
                </td>

                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={(event) => {
                      // Don't also open the details modal
                      event.stopPropagation();
                      dispatch(openBookingWorkflow(booking.id));
                    }}
                    className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 transition hover:bg-gray-100"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && (
        <TablePagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={(page) => dispatch(setPage(page))}
          onPageSizeChange={(size) => dispatch(setPageSize(size))}
        />
      )}
    </div>
  );
}
