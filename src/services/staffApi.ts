import { staffRequest, toQueryString } from "./apiClient";
import {
  sortTasks,
  taskPath,
  type StaffTask,
  type TaskState,
} from "@/components/features/staffPortal/shared/tasks";
import { vehicleName } from "@/libs/utils";
import type {
  AdvisorServiceDetails,
  InvoiceLine,
  StaffAuth,
  StaffLinkRole,
  StaffStep,
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

interface StaffPersonResponse {
  name: string | null;
  email: string | null;
}

// A booking of GET staff/valet/bookings and staff/advisor/bookings (only the
// fields the task list shows)
interface StaffBookingResponse {
  bmsId: string;
  bookingStatus: string;
  statusMessage: string;
  isClosed: boolean;
  vehicle: { year: number; make: string; model: string };
  valet: StaffPersonResponse | null;
  advisor: StaffPersonResponse | null;
  customer: { name: string | null } | null;
  // What this person has on the booking: "PICKUP" and "ADVISOR" seen and, by its
  // name, "DELIVERY"
  assignmentTypes: string[];
}

// The API allows up to 100 bookings a page
const TASKS_LIMIT = 100;

const taskRoles: Record<string, StaffLinkRole> = {
  PICKUP: "pickup",
  DELIVERY: "delivery",
  ADVISOR: "advisor",
};

// Only the "…_ASSIGNED" statuses have been seen: a task is taken as not started
// while the status is one of those, and as done once the booking is closed
function taskState(booking: StaffBookingResponse): TaskState {
  if (booking.isClosed) return "done";
  return booking.bookingStatus.endsWith("_ASSIGNED") ? "todo" : "active";
}

function toTasks(booking: StaffBookingResponse): StaffTask[] {
  const { vehicle } = booking;

  return booking.assignmentTypes.flatMap((type) => {
    const role = taskRoles[type.toUpperCase()];
    if (!role) return [];
    const person = role === "advisor" ? booking.advisor : booking.valet;
    return [
      {
        key: `${booking.bmsId}-${role}`,
        bookingId: booking.bmsId,
        role,
        client: booking.customer?.name ?? "—",
        vehicle: vehicleName({ year: vehicle.year, brand: vehicle.make, model: vehicle.model }),
        state: taskState(booking),
        status: booking.statusMessage,
        path: taskPath(role, booking.bmsId),
        staff: person?.name ? { name: person.name, email: person.email ?? "" } : null,
      },
    ];
  });
}

// What the two booking pages' details share. Their steps come three fields
// each: `<step>Label`, `<step>State` ("COMPLETED" / "CURRENT" / "UPCOMING" seen)
// and `<step>At`, e.g. `tripStartedLabel`.
interface StaffDetailsResponse {
  bmsId: string;
  vehicle: string;
  vin: string;
  customerName: string;
  customerPhone: string;
  bookingStatus: string;
  statusLabel: string;
  nextStatus: string | null;
  nextActionLabel: string | null;
  canUpdateStatus: boolean;
  [field: string]: unknown;
}

// GET staff/valet/bookings/:bmsId
interface ValetTripResponse extends StaffDetailsResponse {
  // "PICKUP" (the only one seen so far) or, by its name, "DELIVERY"
  tripType: string;
  tripLabel: string;
  scheduled: string;
  pickupName: string;
  pickupAddress: string;
  dropoffName: string;
  dropoffAddress: string;
}

// GET staff/advisor/bookings/:bmsId
interface AdvisorServiceResponse extends StaffDetailsResponse {
  bookingDate: string;
  serviceDescription: string | null;
  canGenerateInvoice: boolean;
  invoiceTotal: string | number | null;
  invoiceCurrency: string | null;
  // Only seen empty: taken to be what the advisor sent, `{ description, amount }`
  invoiceItems: { description?: string; amount?: string | number }[] | null;
}

const text = (value: unknown) => (typeof value === "string" ? value : "");

// The steps are read off the field names, in the order the API sends them, so
// ones not seen yet (a delivery trip's) come through without being named here
function toSteps(details: StaffDetailsResponse): StaffStep[] {
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

const toNextAction = (details: StaffDetailsResponse) =>
  details.canUpdateStatus && details.nextStatus
    ? { status: details.nextStatus, label: details.nextActionLabel ?? "Update Status" }
    : null;

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
    steps: toSteps(details),
    nextAction: toNextAction(details),
  };
}

function toAdvisorService(details: AdvisorServiceResponse): AdvisorServiceDetails {
  const steps = toSteps(details);
  const items = (details.invoiceItems ?? []).map((item) => ({
    label: item.description ?? "",
    amount: Number(item.amount) || 0,
  }));

  return {
    id: details.bmsId,
    vehicle: { name: details.vehicle, vin: details.vin },
    customer: { name: details.customerName, phone: details.customerPhone },
    bookingDate: details.bookingDate,
    status: details.statusLabel,
    steps,
    nextAction: toNextAction(details),
    canGenerateInvoice: details.canGenerateInvoice,
    invoice:
      details.invoiceTotal != null
        ? {
            items,
            total: Number(details.invoiceTotal) || 0,
            generatedAt: steps.find((step) => step.key === "invoiceGenerated")?.at,
          }
        : null,
  };
}

// POST booking/valet/status/update and booking/advisor/status/update: the
// status the booking is now at
interface StatusUpdateResponse {
  bmsId: string;
  currentStatus: string;
  // "Valet Dispatched"
  label: string;
  doneAt: string;
  nextStatus: string | null;
  nextActionLabel: string | null;
  canUpdateStatus: boolean;
}

// Endpoints the valet / advisor pages call, all the real API. Staff have their
// own sign-in, separate from the app's: every call takes the page's StaffAuth
// (from the email + OTP form) and sends `gear` as the Bearer token.
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

  // The signed-in valet's or advisor's bookings, newest first, a task per thing
  // they have on each. One page of the most the API gives; the list is searched,
  // filtered and paged in the browser.
  listTasks: async (type: StaffType, auth: StaffAuth): Promise<StaffTask[]> => {
    const { bookings } = await staffRequest<{ bookings: StaffBookingResponse[] }>(
      auth,
      "get",
      `staff/${type}/bookings${toQueryString({ page: 1, pageSize: TASKS_LIMIT })}`,
    );
    return sortTasks(bookings.flatMap(toTasks));
  },

  // One trip of the signed-in valet
  getValetTrip: async (auth: StaffAuth, id: string): Promise<ValetTripDetails> =>
    toValetTrip(await staffRequest<ValetTripResponse>(auth, "get", `staff/valet/bookings/${id}`)),

  // Moves the trip on to its next status (the details' `nextStatus`; the API
  // picks it, the body only names the booking)
  advanceValetTrip: (auth: StaffAuth, id: string) =>
    staffRequest<StatusUpdateResponse>(auth, "post", "booking/valet/status/update", {
      bmsId: id,
    }),

  // A booking's service, for its signed-in advisor
  getAdvisorService: async (auth: StaffAuth, id: string): Promise<AdvisorServiceDetails> =>
    toAdvisorService(
      await staffRequest<AdvisorServiceResponse>(auth, "get", `staff/advisor/bookings/${id}`),
    ),

  // Moves the service on to its next status. The same call sends the bill: only
  // once the details say `canGenerateInvoice` does it carry `items`, with their
  // sum as the total; before that the body only names the booking.
  advanceAdvisorService: (auth: StaffAuth, id: string, items?: InvoiceLine[]) =>
    staffRequest<StatusUpdateResponse>(auth, "post", "booking/advisor/status/update", {
      bmsId: id,
      ...(items && {
        total: items.reduce((sum, item) => sum + item.amount, 0).toFixed(2),
        currency: "USD",
        items: items.map((item) => ({
          description: item.label,
          amount: item.amount.toFixed(2),
        })),
      }),
    }),
};
