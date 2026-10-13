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
  staffTasks,
  TASKS_PAGE_SIZE,
  taskStateLabels,
  taskTitles,
  type StaffTask,
  type TaskState,
} from "@/components/features/staffPortal/shared/tasks";
import { cn, vehicleName } from "@/libs/utils";
import { useStaffBookings } from "@/services/queries/staffQueries";
import type { StaffType } from "@/types/admin";

// /valet and /advisor — every task of the signed-in valet or advisor. Like the
// booking pages, the sign-in comes from localStorage (useStaffAuth); without one
// the email + OTP form shows first. A task opens its booking page.
export function StaffTasks({ type }: { type: StaffType }) {
  const { auth, signedIn, signOut } = useStaffAuth();
  const bookings = useStaffBookings(auth);

  if (!signedIn) {
    return <StaffLogin type={type} hint="Sign in with your Taverna staff email to see your tasks." />;
  }
  if (bookings.isPending) return <BookingSkeleton />;
  if (bookings.isError) {
    return (
      <BookingError
        title="Couldn't Load Your Tasks"
        error={bookings.error}
        onRetry={() => bookings.refetch()}
        onSignIn={signOut}
      />
    );
  }

  return <TaskList tasks={staffTasks(bookings.data)} />;
}

const filters: { value: TaskState | "all"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "todo", label: taskStateLabels.todo },
  { value: "active", label: taskStateLabels.active },
  { value: "done", label: taskStateLabels.done },
];

// Every task in one table, finished ones included: search, a status filter and
// TASKS_PAGE_SIZE rows to a page. All of it happens in the browser, on the one
// list the API returns.
function TaskList({ tasks }: { tasks: StaffTask[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TaskState | "all">("all");
  const [page, setPage] = useState(1);

  const matches = tasks.filter(
    (task) => (filter === "all" || task.state === filter) && matchesTask(task, search),
  );
  const totalPages = Math.max(1, Math.ceil(matches.length / TASKS_PAGE_SIZE));
  // The list refreshes by itself, so the page being looked at can disappear
  const current = Math.min(page, totalPages);
  const shown = matches.slice((current - 1) * TASKS_PAGE_SIZE, current * TASKS_PAGE_SIZE);

  return (
    <div className="page-body pb-8">
      {tasks.length === 0 ? (
        <StateScreen icon={<TaskSquare size={30} />} title="No Tasks Yet">
          Bookings the Taverna team assigns to you show up here. This page updates by itself.
        </StateScreen>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search booking, vehicle or customer"
                aria-label="Search tasks"
                className="field pl-10"
              />
            </div>

            {/* A dropdown, like the status filter of the admin's bookings table */}
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as TaskState | "all");
                setPage(1);
              }}
              className="field w-auto pr-8 text-sm"
              aria-label="Filter by status"
            >
              {filters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {(search !== "" || filter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                  setPage(1);
                }}
                className="h-12 rounded-button px-3 text-sm font-medium text-text-secondary transition hover:bg-white hover:text-text"
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
              No tasks match your search.
            </p>
          )}

          {matches.length > 0 && (
            <div className="card overflow-hidden p-0 [&>div]:border-t-0">
              <TablePagination
                page={current}
                pageSize={TASKS_PAGE_SIZE}
                total={matches.length}
                totalPages={totalPages}
                onPageChange={setPage}
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
  const { booking, role, state } = task;

  return (
    <tr onClick={() => navigate(task.path)} className="group cursor-pointer">
      <td className={cn(cellClass, "whitespace-nowrap")}>
        <Link
          to={task.path}
          onClick={(event) => event.stopPropagation()}
          className="font-bold text-text"
        >
          {booking.id}
        </Link>
        {/* Tells a booking's pickup and delivery trips apart */}
        <span className="block text-xs text-text-secondary">{taskTitles[role]}</span>
      </td>
      <td className={cn(cellClass, "max-w-[130px] truncate")} title={booking.customer.name}>
        {booking.customer.name}
      </td>
      <td
        className={cn(cellClass, "max-w-[150px] truncate font-medium text-text")}
        title={vehicleName(booking.vehicle)}
      >
        {vehicleName(booking.vehicle)}
      </td>
      <td className={cellClass}>
        <StatusChip tone={state === "todo" ? "pending" : state === "done" ? "muted" : "active"}>
          {taskStateLabels[state]}
        </StatusChip>
      </td>
    </tr>
  );
}
