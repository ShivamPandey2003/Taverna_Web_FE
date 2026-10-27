import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBookingListParams, setPage } from "@/redux/adminBookings/adminBookingsSlice";
import {
  openBookingDetails,
  openBookingWorkflow,
  selectAdminModal,
} from "@/redux/modals/adminModal/adminModalSlice";
import { useAdminBookings } from "@/services/queries/adminQueries";
import { cn } from "@/libs/utils";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { TablePagination } from "./TablePagination";

// The API has no sorting (bookings come newest first), so the headers are plain text
const columns = [
  "Booking ID",
  "Customer",
  "Contact",
  "Vehicle",
  "Service",
  "Scheduled",
  "Status",
  "Actions",
];

export function BookingsTable() {
  const dispatch = useAppDispatch();
  const params = useAppSelector(selectBookingListParams);
  const { data, isPending, isError, isFetching, refetch } = useAdminBookings(params);
  // Booking open in the side drawer, if any
  const { workflowBookingId } = useAppSelector(selectAdminModal);

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Scrolls on its own only if the screen is too short for a full page */}
      <div className="relative min-h-0 overflow-auto">
        {/* Thin bar while a new page / search loads over the current rows */}
        {isFetching && !isPending && (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-black" />
        )}

        <table className="w-full min-w-[960px] text-left text-[13px]">
          <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5",
                    // Sits over the centred Manage button
                    column === "Actions" && "text-center",
                  )}
                >
                  {column}
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
                    data-test-id="bookings-retry"
                    type="button"
                    onClick={() => refetch()}
                    className="mt-3 text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-black"
                  >
                    Try Again
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
                data-test-id={`booking-row-${booking.id}`}
                key={booking.id}
                // While the drawer is open, a row click switches it to that booking
                onClick={() =>
                  dispatch(
                    workflowBookingId
                      ? openBookingWorkflow(booking.id)
                      : openBookingDetails(booking.id),
                  )
                }
                className={cn(
                  "cursor-pointer transition",
                  booking.id === workflowBookingId ? "bg-gray-100" : "hover:bg-gray-50",
                )}
              >
                {/* One line per row; the full details are in the booking modal */}
                <td className="whitespace-nowrap px-4 py-2 font-semibold text-gray-900">
                  {booking.id}
                </td>

                <td
                  className="max-w-[200px] truncate px-4 py-2 font-medium text-gray-900"
                  title={booking.customerName}
                >
                  {booking.customerName}
                </td>

                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {booking.customerPhone}
                </td>

                <td
                  className="max-w-[220px] truncate px-4 py-2 text-gray-900"
                  title={booking.vehicle}
                >
                  {booking.vehicle}
                </td>

                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {booking.service}
                </td>

                <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                  {booking.scheduled}
                </td>

                <td className="px-4 py-2">
                  <BookingStatusBadge status={booking.status} code={booking.statusCode} label={booking.statusLabel} />
                </td>

                <td className="px-4 py-2 text-center">
                  <button
                    data-test-id={`booking-manage-${booking.id}`}
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
          testId="bookings-pagination"
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={(page) => dispatch(setPage(page))}
        />
      )}
    </div>
  );
}
