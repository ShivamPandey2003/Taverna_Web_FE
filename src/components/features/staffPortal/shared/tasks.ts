import { isComplete, valetTrip } from "@/components/features/admin/admin.utils";
import { vehicleName } from "@/libs/utils";
import { TRIP_END, type StaffBooking, type StaffLinkRole } from "@/types/admin";

export type TaskState = "todo" | "active" | "done";

// One job of a staff member: a valet's trip or an advisor's service on a booking
export interface StaffTask {
  key: string;
  booking: StaffBooking;
  role: StaffLinkRole;
  state: TaskState;
  // The booking page where the task is worked on
  path: string;
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

function taskState(booking: StaffBooking, role: StaffLinkRole): TaskState {
  if (isComplete(booking)) return "done";
  if (role === "advisor") {
    // The advisor's part ends with the invoice (see AdvisorUpdate)
    if (booking.invoice) return "done";
    return booking.advisorProgress?.inspecting ? "active" : "todo";
  }
  const { progress } = valetTrip(booking, role);
  if (progress[TRIP_END[role]]) return "done";
  return progress.dispatched ? "active" : "todo";
}

// Tasks per page of the task list
export const TASKS_PAGE_SIZE = 8;

// Booking ID, task, vehicle or customer, whichever the staff member remembers
export function matchesTask(task: StaffTask, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const { booking } = task;
  return [
    booking.id,
    taskTitles[task.role],
    vehicleName(booking.vehicle),
    booking.customer.name,
  ].some((text) => text.toLowerCase().includes(query));
}

const stateOrder: TaskState[] = ["active", "todo", "done"];

// A task per page the staff member may use on each booking (`linkRoles`): what's
// under way first, then what hasn't started, then what's finished
export function staffTasks(bookings: StaffBooking[]): StaffTask[] {
  return bookings
    .flatMap((booking) =>
      (booking.linkRoles ?? []).map((role) => ({
        key: `${booking.id}-${role}`,
        booking,
        role,
        state: taskState(booking, role),
        path: role === "advisor" ? `/advisor/${booking.id}` : `/valet/${role}/${booking.id}`,
      })),
    )
    .sort((first, second) => stateOrder.indexOf(first.state) - stateOrder.indexOf(second.state));
}
