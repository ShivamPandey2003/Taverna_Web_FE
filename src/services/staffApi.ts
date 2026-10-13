import { callStaffApi, staffRequest, toQueryString } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import {
  sortTasks,
  taskPath,
  type StaffTask,
  type TaskState,
} from "@/components/features/staffPortal/shared/tasks";
import { vehicleName } from "@/libs/utils";
import type {
  AdvisorMilestone,
  InvoiceLine,
  StaffAuth,
  StaffBooking,
  StaffType,
  ValetLeg,
  ValetTripDetails,
} from "@/types/admin";

// The real API's `user_type` for each kind of staff
const userTypes: Record<StaffType, number> = { advisor: 1, valet: 2 };

// POST staff/verify-otp
interface StaffSessionResponse {
  accessToken: string;
  expiresInSeconds: number;
  staff: { name: string; email: string; phone: string };
  user_type: number;
}

// A booking of GET staff/valet/bookings (only the fields the task list shows)
interface ValetBookingResponse {
  bmsId: string;
  bookingStatus: string;
  statusMessage: string;
  isClosed: boolean;
  vehicle: { year: number; make: string; model: string };
  valet: { name: string | null; email: string | null } | null;
  customer: { name: string | null } | null;
  // The trips of the booking this valet has: "PICKUP" (the only one seen so
  // far) and, by its name, "DELIVERY"
  assignmentTypes: string[];
}

// The API allows up to 100 bookings a page
const VALET_TASKS_LIMIT = 100;

const valetLegs: Record<string, ValetLeg> = { PICKUP: "pickup", DELIVERY: "delivery" };

// Only VALET_ASSIGNED has been seen: a trip is taken as not started while the
// status is an "…_ASSIGNED" one, and as done once the booking is closed
function valetTaskState(booking: ValetBookingResponse): TaskState {
  if (booking.isClosed) return "done";
  return booking.bookingStatus.endsWith("_ASSIGNED") ? "todo" : "active";
}

function toValetTasks(booking: ValetBookingResponse): StaffTask[] {
  const { vehicle, valet } = booking;

  return booking.assignmentTypes.flatMap((type) => {
    const role = valetLegs[type.toUpperCase()];
    if (!role) return [];
    return [
      {
        key: `${booking.bmsId}-${role}`,
        bookingId: booking.bmsId,
        role,
        client: booking.customer?.name ?? "—",
        vehicle: vehicleName({ year: vehicle.year, brand: vehicle.make, model: vehicle.model }),
        state: valetTaskState(booking),
        status: booking.statusMessage,
        path: taskPath(role, booking.bmsId),
        staff: valet?.name ? { name: valet.name, email: valet.email ?? "" } : null,
      },
    ];
  });
}

// GET staff/valet/bookings/:bmsId
interface ValetTripResponse {
  bmsId: string;
  // "PICKUP" (the only one seen so far) or, by its name, "DELIVERY"
  tripType: string;
  tripLabel: string;
  vehicle: string;
  vin: string;
  scheduled: string;
  customerName: string;
  customerPhone: string;
  pickupName: string;
  pickupAddress: string;
  dropoffName: string;
  dropoffAddress: string;
  bookingStatus: string;
  statusLabel: string;
  nextStatus: string | null;
  nextActionLabel: string | null;
  canUpdateStatus: boolean;
  // The trip's steps, three fields each: `<step>Label`, `<step>State`
  // ("CURRENT" / "UPCOMING" seen) and `<step>At`, e.g. `tripStartedLabel`
  [field: string]: unknown;
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

// The steps are read off the field names, in the order the API sends them, so a
// delivery trip's (not seen yet) come through without being named here
function tripSteps(details: ValetTripResponse): ValetTripDetails["steps"] {
  return Object.keys(details)
    .filter((field) => field.endsWith("State") && `${field.slice(0, -5)}Label` in details)
    .map((field) => {
      const key = field.slice(0, -5);
      const state = text(details[field]).toUpperCase();
      const at = text(details[`${key}At`]);
      return {
        key,
        label: text(details[`${key}Label`]),
        done: !!at || (!!state && state !== "CURRENT" && state !== "UPCOMING"),
        at: at || undefined,
      };
    });
}

function toValetTrip(details: ValetTripResponse): ValetTripDetails {
  const leg: ValetLeg = details.tripType?.toUpperCase() === "DELIVERY" ? "delivery" : "pickup";
  const pickup = { label: details.pickupName, address: details.pickupAddress };
  const dropoff = { label: details.dropoffName, address: details.dropoffAddress };
  const phone = details.customerPhone || undefined;

  return {
    id: details.bmsId,
    leg,
    title: details.tripLabel,
    vehicle: { name: details.vehicle, vin: details.vin },
    scheduled: details.scheduled,
    status: details.statusLabel,
    // The customer is where a pickup starts and a delivery ends
    from: leg === "pickup" ? { ...pickup, phone } : pickup,
    to: leg === "delivery" ? { ...dropoff, phone } : dropoff,
    steps: tripSteps(details),
    nextAction:
      details.canUpdateStatus && details.nextStatus
        ? { status: details.nextStatus, label: details.nextActionLabel ?? "Update Status" }
        : null,
  };
}

// POST booking/valet/status/update: the status the trip is now at
interface ValetStatusUpdateResponse {
  bmsId: string;
  currentStatus: string;
  // "Valet Dispatched"
  label: string;
  doneAt: string;
  nextStatus: string | null;
  nextActionLabel: string | null;
  canUpdateStatus: boolean;
}

// Endpoints the valet / advisor pages call. Staff have their own sign-in,
// separate from the app's: every call takes the page's StaffAuth (from the
// link's search params or the email + OTP form) and sends `gear` as the Bearer
// token. The sign-in and the valet's calls are the real API; the advisor's
// mirror the admin endpoints (adminApi.ts) under /staff and are still proposed
// paths, answered by the mock.
export const staffApi = {
  // Emails a one-time password to a valet or advisor; asking again sends a new one
  sendOtp: (email: string, type: StaffType) =>
    staffRequest(null, "post", "staff/login", { email, user_type: userTypes[type] }),

  // The access token becomes the sign-in's `gear`
  verifyOtp: async (email: string, otp: string, type: StaffType): Promise<StaffAuth> => {
    const session = await staffRequest<StaffSessionResponse>(null, "post", "staff/verify-otp", {
      email,
      otp,
      user_type: userTypes[type],
    });
    return {
      gear: session.accessToken,
      token: type,
      email: session.staff?.email ?? email,
      name: session.staff?.name,
    };
  },

  // Real API: the signed-in valet's bookings, newest first, a task per trip of
  // each. One page of the most the API gives; the list is searched, filtered and
  // paged in the browser.
  listValetTasks: async (auth: StaffAuth): Promise<StaffTask[]> => {
    const { bookings } = await staffRequest<{ bookings: ValetBookingResponse[] }>(
      auth,
      "get",
      `staff/valet/bookings${toQueryString({ page: 1, pageSize: VALET_TASKS_LIMIT })}`,
    );
    return sortTasks(bookings.flatMap(toValetTasks));
  },

  // Real API: one trip of the signed-in valet
  getValetTrip: async (auth: StaffAuth, id: string): Promise<ValetTripDetails> =>
    toValetTrip(await staffRequest<ValetTripResponse>(auth, "get", `staff/valet/bookings/${id}`)),

  // Real API: moves the trip on to its next status (the details' `nextStatus`; the
  // API picks it, the body only names the booking)
  advanceValetTrip: (auth: StaffAuth, id: string) =>
    staffRequest<ValetStatusUpdateResponse>(auth, "post", "booking/valet/status/update", {
      bmsId: id,
    }),

  // Every booking the signed-in advisor is assigned to; `linkRoles` says which
  // of each booking's pages are theirs (proposed path)
  listBookings: (auth: StaffAuth) =>
    callStaffApi(
      () => mockServer.listStaffBookings(auth),
      () => staffRequest<StaffBooking[]>(auth, "get", "/staff/bookings"),
    ),

  getBooking: (auth: StaffAuth, id: string) =>
    callStaffApi(
      () => mockServer.getStaffBooking(auth, id),
      () => staffRequest<StaffBooking>(auth, "get", `/staff/bookings/${id}`),
    ),

  // Service updates the advisor shares with the customer (in order)
  updateAdvisorProgress: (auth: StaffAuth, id: string, milestone: AdvisorMilestone) =>
    callStaffApi(
      () => mockServer.staffUpdateAdvisorProgress(auth, id, milestone),
      () =>
        staffRequest<StaffBooking>(
          auth,
          "put",
          `/staff/bookings/${id}/relationship-manager/progress`,
          { milestone },
        ),
    ),

  // Sends the customer the bill the advisor filled in; the server adds tax and totals it
  generateInvoice: (auth: StaffAuth, id: string, items: InvoiceLine[]) =>
    callStaffApi(
      () => mockServer.staffGenerateInvoice(auth, id, items),
      () => staffRequest<StaffBooking>(auth, "post", `/staff/bookings/${id}/invoice`, { items }),
    ),

  // The advisor has checked that the customer paid the invoice
  confirmPayment: (auth: StaffAuth, id: string) =>
    callStaffApi(
      () => mockServer.staffConfirmPayment(auth, id),
      () => staffRequest<StaffBooking>(auth, "put", `/staff/bookings/${id}/payment/confirm`),
    ),
};
