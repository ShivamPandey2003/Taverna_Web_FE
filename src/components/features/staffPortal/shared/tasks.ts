import type { StaffLinkRole, StaffMember, StaffType } from "@/types/admin";

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

// The task lists' status filters: the codes staff/valet/bookings and
// staff/advisor/bookings take as `status`, with the names the app shows for them.
// The valet's two trips share names, so they're grouped; a group without a name
// is listed without a heading.
type StatusFilterGroup = { group?: string; options: { code: string; label: string }[] };

const VALET_STATUS_FILTERS: StatusFilterGroup[] = [
  {
    group: "Pickup",
    options: [
      { code: "VALET_ASSIGNED", label: "Valet Ready" },
      { code: "VALET_DISPATCHED", label: "Valet EnRoute" },
      { code: "VALET_ARRIVED_AT_CUSTOMER", label: "Valet Arrived" },
      { code: "VALET_PICKUP_CONFIRMED", label: "Pickup Booked" },
      { code: "VEHICLE_PICKED_UP", label: "Pickup EnRoute" },
      { code: "VEHICLE_ARRIVED_AT_DEALERSHIP", label: "At Dealership" },
    ],
  },
  {
    group: "Delivery",
    options: [
      { code: "DELIVERY_VALET_ASSIGNED", label: "Valet Ready" },
      { code: "DELIVERY_VALET_DISPATCHED", label: "Valet EnRoute" },
      { code: "DELIVERY_VALET_ARRIVED_AT_CUSTOMER", label: "Valet Arrived" },
      { code: "VEHICLE_DELIVERED", label: "Vehicle Delivered" },
    ],
  },
];

const ADVISOR_STATUS_FILTERS: StatusFilterGroup[] = [
  {
    options: [
      { code: "ADVISOR_ASSIGNED", label: "Advisor Ready" },
      { code: "VEHICLE_IN_INSPECTION", label: "Inspecting" },
      { code: "VEHICLE_IN_SERVICE", label: "Servicing" },
      { code: "INVOICE_GENERATED", label: "Bill Generation" },
    ],
  },
];

export const STATUS_FILTERS: Record<StaffType, StatusFilterGroup[]> = {
  valet: VALET_STATUS_FILTERS,
  advisor: ADVISOR_STATUS_FILTERS,
};

// Booking ID, task, vehicle or customer, whichever the staff member remembers
export function matchesTask(task: StaffTask, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  return [task.bookingId, taskTitles[task.role], task.vehicle, task.client].some((text) =>
    text.toLowerCase().includes(query),
  );
}
