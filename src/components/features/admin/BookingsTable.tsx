import { SortAsc, SortDesc, SortV } from "reicon-react";
import { cn } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectBookingListParams,
  toggleSort,
} from "@/redux/adminBookings/adminBookingsSlice";
import {
  openBookingWorkflow,
  WORKFLOW_STEPS,
} from "@/redux/modals/adminModal/adminModalSlice";
import { useAdminBookings } from "@/services/queries/adminQueries";
import type { BookingSortField } from "@/types/admin";
import { BookingStatusBadge } from "./BookingStatusBadge";
import { TablePagination } from "./TablePagination";
import {
  completedStepCount,
  formatShortDateTime,
  serviceLabels,
} from "./admin.utils";

const columns: { label: string; sortField?: BookingSortField }[] = [
  { label: "Booking ID", sortField: "id" },
  { label: "Customer", sortField: "customer" },
  { label: "Vehicle" },
  { label: "Service" },
  { label: "Created", sortField: "createdAt" },
  { label: "Scheduled", sortField: "scheduledAt" },
  { label: "Status", sortField: "status" },
  { label: "Progress" },
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
                onClick={() => dispatch(openBookingWorkflow(booking.id))}
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

                <td className="px-4 py-2">
                  <ProgressDots done={completedStepCount(booking)} />
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
        />
      )}
    </div>
  );
}

function SortButton({
  label,
  active,
  order,
  onClick,
}: {
  label: string;
  active: boolean;
  order: "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = !active ? SortV : order === "asc" ? SortAsc : SortDesc;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 uppercase tracking-wide transition hover:text-gray-900",
        active && "text-gray-900",
      )}
    >
      {label}
      <Icon size={14} className={active ? "text-gray-900" : "text-gray-300"} />
    </button>
  );
}

// Filled dots = workflow steps done (confirm, valet, manager, payment)
function ProgressDots({ done }: { done: number }) {
  return (
    <div className="flex items-center gap-2" title={`${done} of ${WORKFLOW_STEPS.length} steps done`}>
      <div className="flex gap-1">
        {WORKFLOW_STEPS.map((step, index) => (
          <span
            key={step}
            className={cn(
              "h-1.5 w-4 rounded-full",
              index < done ? "bg-emerald-500" : "bg-gray-200",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {done}/{WORKFLOW_STEPS.length}
      </span>
    </div>
  );
}
