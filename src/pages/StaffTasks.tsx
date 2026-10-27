import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, TaskSquare } from "reicon-react";
import { StateScreen } from "@/components/ui/StateScreen";
import { TablePagination } from "@/components/features/admin/TablePagination";
import { BookingError } from "@/components/features/staffPortal/shared/BookingError";
import { BookingSkeleton } from "@/components/features/staffPortal/shared/BookingSkeleton";
import { StaffLogin } from "@/components/features/staffPortal/shared/StaffLogin";
import { StatusChip } from "@/components/features/staffPortal/shared/StatusChip";
import { useStaffAuth } from "@/components/features/staffPortal/shared/useStaffAuth";
import {
  matchesTask,
  STATUS_FILTERS,
  TASKS_PAGE_SIZE,
  taskTitles,
  type StaffTask,
} from "@/components/features/staffPortal/shared/tasks";
import { cn } from "@/libs/utils";
import { useStaffTasks } from "@/services/queries/staffQueries";
import type { StaffTaskPage } from "@/services/staffApi";
import type { StaffType } from "@/types/admin";

// /valet and /advisor — every task of the signed-in valet or advisor. Like the
// booking pages, the sign-in comes from localStorage (useStaffAuth); without one
// the email + OTP form shows first. A task opens its booking page.
export function StaffTasks({ type }: { type: StaffType }) {
  const { auth, signedIn, signOut } = useStaffAuth();
  // The API pages the list (TASKS_PAGE_SIZE bookings a page) and filters it by
  // status ("" = all)
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const tasks = useStaffTasks(type, auth, page, status);

  // The list refreshes by itself, so the page being looked at can disappear
  const lastPage = tasks.data?.totalPages;
  if (lastPage && page > lastPage) setPage(lastPage);

  if (!signedIn) {
    return <StaffLogin type={type} hint="Sign in with your Taverna staff email to see your tasks." />;
  }
  if (tasks.isPending) return <BookingSkeleton />;
  if (tasks.isError) {
    return (
      <BookingError
        title="Couldn't Load Your Tasks"
        error={tasks.error}
        onRetry={() => tasks.refetch()}
        onSignIn={signOut}
      />
    );
  }

  return (
    <TaskList
      type={type}
      data={tasks.data}
      page={page}
      onPageChange={setPage}
      status={status}
      onStatusChange={(next) => {
        setStatus(next);
        setPage(1);
      }}
    />
  );
}

// One page of tasks, finished ones included, in one table. The API pages them
// and filters them by status (STATUS_FILTERS); the search works on the page
// shown. The pagination only shows when there's more than one page.
function TaskList({
  type,
  data,
  page,
  onPageChange,
  status,
  onStatusChange,
}: {
  type: StaffType;
  data: StaffTaskPage;
  page: number;
  onPageChange: (page: number) => void;
  status: string;
  onStatusChange: (status: string) => void;
}) {
  const { tasks, totalItems, totalPages } = data;
  const [search, setSearch] = useState("");

  const shown = tasks.filter((task) => matchesTask(task, search));
  const filtered = search !== "" || status !== "";

  return (
    <div className="page-body pb-8">
      {/* Nothing assigned at all; with a filter on, the toolbar stays so it can be cleared */}
      {totalItems === 0 && !filtered ? (
        <StateScreen icon={<TaskSquare size={30} />} title="No Tasks Yet">
          Bookings the Taverna team assigns to you show up here.
        </StateScreen>
      ) : (
        <>
          {/* One line from sm: the search box gives up its width so the status
              filter and Clear Filters fit beside it (the valet's statuses are
              longer than the advisor's); on a phone they may wrap */}
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <div className="relative min-w-[180px] flex-1 sm:min-w-0">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                data-test-id="staff-tasks-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search booking, vehicle or customer"
                aria-label="Search tasks"
                className="field pl-10"
              />
            </div>

            {/* A dropdown, like the status filter of the admin's bookings table:
                the API's statuses (a valet's grouped by trip) */}
            <select
              data-test-id="staff-tasks-status-filter"
              value={status}
              onChange={(event) => onStatusChange(event.target.value)}
              className="field w-auto shrink-0 pr-8 text-sm"
              aria-label="Filter by status"
            >
              <option value="">All Status</option>
              {STATUS_FILTERS[type].map(({ group, options }) => {
                const items = options.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ));
                return group ? (
                  <optgroup key={group} label={group}>
                    {items}
                  </optgroup>
                ) : (
                  items
                );
              })}
            </select>

            {filtered && (
              <button
                data-test-id="staff-tasks-clear"
                type="button"
                onClick={() => {
                  setSearch("");
                  if (status) onStatusChange("");
                }}
                className="h-12 shrink-0 whitespace-nowrap rounded-button px-3 text-sm font-medium text-text-secondary transition hover:bg-white hover:text-text"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Still a table, so the columns line up, but drawn as a list: each row
              is its own rounded card with a gap to the next, and the column names
              are just small labels above */}
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs font-medium text-text-secondary">
                <tr>
                  {["Booking", "Client", "Vehicle", "Status"].map((label) => (
                    <th key={label} className="whitespace-nowrap px-4 pb-0 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {shown.map((task) => (
                  <TaskRow key={task.key} task={task} />
                ))}
              </tbody>
            </table>
          </div>

          {shown.length === 0 && (
            <p className="card py-10 text-center text-sm text-text-secondary">
              No tasks match your search or filter.
            </p>
          )}

          {totalPages > 1 && (
            <div className="card overflow-hidden p-0 [&>div]:border-t-0">
              <TablePagination
                testId="staff-tasks-pagination"
                page={page}
                pageSize={TASKS_PAGE_SIZE}
                total={totalItems}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// The cells of a row share one card: white, a border along the top and bottom,
// and the two end cells close it with a side border and rounded corners
const cellClass =
  "border-y border-border bg-white px-4 py-3 transition-colors first:rounded-l-card first:border-l last:rounded-r-card last:border-r group-hover:border-primary/40 group-hover:bg-primary/[0.03]";

// One task: booking, client, vehicle and how it's going. The whole row opens the
// booking page; the booking ID is the link for keyboards and screen readers.
function TaskRow({ task }: { task: StaffTask }) {
  const navigate = useNavigate();
  const { role, state } = task;

  return (
    <tr data-test-id={`staff-task-row-${task.role}-${task.bookingId}`} onClick={() => navigate(task.path)} className="group cursor-pointer">
      <td className={cn(cellClass, "whitespace-nowrap")}>
        <Link
          data-test-id={`staff-task-link-${task.role}-${task.bookingId}`}
          to={task.path}
          onClick={(event) => event.stopPropagation()}
          className="font-bold text-text"
        >
          {task.bookingId}
        </Link>
        {/* Tells a booking's pickup and delivery trips apart */}
        <span className="block text-xs text-text-secondary">{taskTitles[role]}</span>
      </td>
      <td className={cn(cellClass, "max-w-[130px] truncate")} title={task.client}>
        {task.client}
      </td>
      <td
        className={cn(cellClass, "max-w-[150px] truncate font-medium text-text")}
        title={task.vehicle}
      >
        {task.vehicle}
      </td>
      <td className={cellClass}>
        <StatusChip tone={state === "todo" ? "pending" : state === "done" ? "muted" : "active"}>
          {task.status}
        </StatusChip>
      </td>
    </tr>
  );
}
