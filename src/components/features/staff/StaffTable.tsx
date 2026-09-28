import { cn } from "@/libs/utils";
import { SortButton } from "@/components/features/admin/SortButton";
import { TablePagination } from "@/components/features/admin/TablePagination";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectStaffListParams,
  setStaffPage,
  toggleStaffSort,
} from "@/redux/adminStaff/adminStaffSlice";
import {
  openDeleteStaffMember,
  openEditStaffMember,
} from "@/redux/modals/staffModal/staffModalSlice";
import { useStaffList } from "@/services/queries/adminQueries";
import type { StaffRole, StaffSortField } from "@/types/admin";
import { staffRoleLabels } from "./staff.utils";

const columns: { label: string; sortField?: StaffSortField; className?: string }[] = [
  { label: "Name", sortField: "name" },
  { label: "Email", sortField: "email" },
  { label: "Phone", sortField: "phone" },
  { label: "Status", sortField: "available" },
  { label: "Active bookings" },
  { label: "Actions", className: "text-right" },
];

export function StaffTable({ role }: { role: StaffRole }) {
  const dispatch = useAppDispatch();
  const params = useAppSelector((state) => selectStaffListParams(state, role));
  const { data, isPending, isError, isFetching, refetch } = useStaffList(role, params);

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Scrolls on its own only if the screen is too short for a full page */}
      <div className="relative min-h-0 overflow-auto">
        {/* Thin bar while a new page / sort / search loads over the current rows */}
        {isFetching && !isPending && (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-emerald-500" />
        )}

        <table className="w-full min-w-[880px] text-left text-[13px]">
          <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.label}
                  className={cn("whitespace-nowrap px-4 py-2.5", column.className)}
                >
                  {column.sortField ? (
                    <SortButton
                      label={column.label}
                      active={params.sortBy === column.sortField}
                      order={params.sortOrder}
                      onClick={() =>
                        dispatch(toggleStaffSort({ role, value: column.sortField! }))
                      }
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
                  <p className="text-sm text-gray-500">
                    Couldn't load {staffRoleLabels[role]}s.
                  </p>
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
                  No {staffRoleLabels[role]}s match your search or filters.
                </td>
              </tr>
            )}

            {data?.items.map((member) => {
              // Anyone on an unfinished booking can't be deleted
              const assigned = (member.activeBookings ?? 0) > 0;

              return (
                <tr key={member.id} className="transition hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate font-semibold text-gray-900">{member.name}</span>
                    </div>
                  </td>

                  <td className="max-w-[240px] truncate px-4 py-2 text-gray-700" title={member.email}>
                    {member.email || "—"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">{member.phone}</td>

                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        member.available
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {member.available ? "Available" : "Busy"}
                    </span>
                  </td>

                  {/* "Available" only means they can take new bookings; this is what blocks delete */}
                  <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                    {assigned ? (
                      <span className="font-semibold text-gray-900">{member.activeBookings}</span>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </td>

                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => dispatch(openEditStaffMember(member))}
                        className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 transition hover:bg-gray-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={assigned}
                        onClick={() => dispatch(openDeleteStaffMember(member))}
                        title={
                          assigned
                            ? `On ${member.activeBookings} active booking${member.activeBookings === 1 ? "" : "s"}. They can be deleted once ${member.activeBookings === 1 ? "it's" : "they're"} complete.`
                            : undefined
                        }
                        className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && (
        <TablePagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={(page) => dispatch(setStaffPage({ role, value: page }))}
        />
      )}
    </div>
  );
}
