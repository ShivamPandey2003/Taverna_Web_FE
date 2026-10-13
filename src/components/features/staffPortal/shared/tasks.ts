import type { StaffLinkRole, StaffMember } from "@/types/admin";

export type TaskState = "todo" | "active" | "done";

// One job of a staff member: a valet's trip or an advisor's service on a booking.
// A row of the task list, with all it shows.
export interface StaffTask {
  key: string;
  bookingId: string;
  role: StaffLinkRole;
  client: string;
  vehicle: string;
  state: TaskState;
  // The status chip's text
  status: string;
  // The booking page where the task is worked on
  path: string;
  // Who the task is assigned to: the person signed in
  staff: Pick<StaffMember, "name" | "email"> | null;
}

export const taskTitles: Record<StaffLinkRole, string> = {
  pickup: "Pickup",
  advisor: "Service",
  delivery: "Delivery",
};

export const taskStateLabels: Record<TaskState, string> = {
  todo: "Not started",
  active: "In progress",
  done: "Done",
};

export const taskPath = (role: StaffLinkRole, bookingId: string) =>
  role === "advisor" ? `/advisor/${bookingId}` : `/valet/${role}/${bookingId}`;

// Tasks per page of the task list
export const TASKS_PAGE_SIZE = 8;

// Booking ID, task, vehicle or customer, whichever the staff member remembers
export function matchesTask(task: StaffTask, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [task.bookingId, taskTitles[task.role], task.vehicle, task.client].some((text) =>
    text.toLowerCase().includes(query),
  );
}

const stateOrder: TaskState[] = ["active", "todo", "done"];

// What's under way first, then what hasn't started, then what's finished
export const sortTasks = (tasks: StaffTask[]) =>
  [...tasks].sort(
    (first, second) => stateOrder.indexOf(first.state) - stateOrder.indexOf(second.state),
  );
