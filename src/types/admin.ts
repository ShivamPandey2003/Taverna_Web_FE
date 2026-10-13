import type { BookingStatus } from "./booking";
import type { ServiceId } from "./service";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  available: boolean;
  // Unfinished bookings they're assigned to; only sent in staff list responses.
  // Someone with any can't be deleted.
  activeBookings?: number;
}

// Which kind of staff member a picker or the "add staff" modal deals with
export type StaffRole = "valet" | "manager";

export type PaymentMethod = "card" | "cash" | "insurance" | "warranty";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface PaymentInfo {
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  updatedAt: string;
}

export interface InvoiceLine {
  label: string;
  amount: number;
}

// Tax added to every bill. The advisor's bill form previews it; the server applies it.
export const INVOICE_TAX_RATE = 0.08;

// Bill the customer sees once the service is done (status "Bill Generated")
export interface Invoice {
  issuedAt: string;
  items: InvoiceLine[];
  subtotal: number;
  // e.g. 0.08 for 8%
  taxRate: number;
  tax: number;
  total: number;
}

// Each vehicle trip has its own valet: pickup (customer → dealership) and
// delivery (dealership → customer). Both go through the same milestones, in order;
// what each one means depends on the leg (see admin.utils.ts for the labels).
export type ValetLeg = "pickup" | "delivery";

export const VALET_LEGS: readonly ValetLeg[] = ["pickup", "delivery"];

// Who a staff link is for: one of the two valets, or the advisor
export type StaffLinkRole = ValetLeg | "advisor";

// What the valet / advisor pages sign in with. It has nothing to do with the
// app's own login (AuthSession): it comes from the link's `gear` and `token`
// search params, or from the staff email + OTP sign-in.
export interface StaffAuth {
  // The auth token
  gear: string;
  // The staff type: encrypted in a link (only the server can read it), plain
  // "valet" / "advisor" after an email + OTP sign-in
  token: string;
  // Who signed in with email + OTP; a link has neither
  email?: string;
  name?: string;
}

export type StaffType = "valet" | "advisor";

export const VALET_MILESTONES = [
  "dispatched",
  // At the pickup point: the customer (pickup) or the dealership (delivery)
  "arrived",
  "pickedUp",
  // Driving the vehicle to its destination
  "enRoute",
  "reached",
  // Vehicle handed over to the customer
  "delivered",
] as const;
export type ValetMilestone = (typeof VALET_MILESTONES)[number];

// The milestones of each trip, in order; neither uses every key. The pickup trip
// ends once the vehicle reaches the dealership; the delivery trip goes from
// dispatched straight to picked up, and from there to arriving at the customer.
export const LEG_MILESTONES: Record<ValetLeg, readonly ValetMilestone[]> = {
  pickup: ["dispatched", "arrived", "pickedUp", "reached"],
  delivery: ["dispatched", "pickedUp", "reached", "delivered"],
};

// The milestone that finishes each trip
export const TRIP_END: Record<ValetLeg, ValetMilestone> = {
  pickup: "reached",
  delivery: "delivered",
};

// How the vehicle gets to the dealership, picked by the admin in the Vehicle
// Intake step. Only "valet" has a valet and a trip to follow; with the other two
// the admin just confirms that the vehicle arrived (`pickupProgress.reached`).
export const INTAKE_METHODS = ["valet", "towTruck", "selfDrive"] as const;
export type IntakeMethod = (typeof INTAKE_METHODS)[number];

// The choices on each trip, which depend on the service that was booked: with
// Pickup & Delivery the dealership moves the vehicle (a valet, or a tow truck on
// the way in); with Loaner Only the customer brings and collects it themselves,
// which the admin confirms (`pickupProgress.reached` / `deliveryProgress.delivered`).
// A trip with a single choice needs no picking: see `defaultLegMethod`.
export const LEG_METHODS: Record<ServiceId, Record<ValetLeg, readonly IntakeMethod[]>> = {
  "pickup-delivery": { pickup: ["valet", "towTruck"], delivery: ["valet"] },
  "loaner-only": { pickup: ["selfDrive"], delivery: ["selfDrive"] },
};

// How a trip is made until the admin picks something else: the only choice the
// booked service has, or for the way in what the customer booked (a tow truck when
// they asked for one, a valet for a vehicle that can be driven). null leaves it to
// the admin: the vehicle can't be driven and no tow truck was asked for.
export function defaultLegMethod(
  booking: Pick<AdminBooking, "serviceId" | "driveable" | "towTruck">,
  leg: ValetLeg,
): IntakeMethod | null {
  const options = LEG_METHODS[booking.serviceId][leg];
  if (options.length === 1) return options[0];
  if (leg !== "pickup") return null;
  if (booking.towTruck) return "towTruck";
  return booking.driveable ? "valet" : null;
}

// Updates the advisor shares with the customer while the vehicle is serviced, in
// order. The bill and payment that follow come from `invoice` and `payment`; then
// the advisor hands the vehicle over for the delivery valet (`ADVISOR_HANDOVER`).
export const ADVISOR_MILESTONES = ["inspecting", "inService"] as const;
export const ADVISOR_HANDOVER = "readyForDispatch";
export type AdvisorMilestone = (typeof ADVISOR_MILESTONES)[number] | typeof ADVISOR_HANDOVER;

// When each milestone was reached (ISO strings); missing = not reached yet
export type MilestoneLog<T extends string> = Partial<Record<T, string>>;

// Where a booking is on the API's journey: the step names of
// booking/admin/:bmsId/journey-labels and the status of …/status-summary
export interface BookingJourney {
  // The steps this booking goes through, in order, with the API's names. A key
  // is the status code in camel case: VALET_DISPATCHED is "valetDispatched".
  steps: { key: string; label: string }[];
  // The step the booking is at; not one of `steps` before the journey starts
  current: string;
  // The API's name for the current status, and when it was reached (text ready
  // to show). Earlier steps' times aren't sent.
  statusLabel: string;
  doneAt: string | null;
}

// The steps come in order, so every step up to the current one has been reached
export function journeyReached(journey: BookingJourney, key: string) {
  const keys = journey.steps.map((step) => step.key);
  const index = keys.indexOf(key);
  return index !== -1 && index <= keys.indexOf(journey.current);
}

// The pickup valet's trip on the journey, as the Vehicle Intake step shows it.
// The API has more steps in between (the customer's confirmations); they're left out.
export const INTAKE_JOURNEY = [
  "valetAssigned",
  "valetDispatched",
  "valetArrivedAtCustomer",
  "vehiclePickedUp",
  "vehicleArrivedAtDealership",
] as const;

// The valet's last step, and the admin's confirmation that ends the intake
export const INTAKE_ARRIVED = "vehicleArrivedAtDealership";
export const INTAKE_CONFIRMED = "vehicleAtDealershipConfirmed";

const PICKUP_JOURNEY_STEPS: Partial<Record<ValetMilestone, string>> = {
  dispatched: "valetDispatched",
  arrived: "valetArrivedAtCustomer",
  pickedUp: "vehiclePickedUp",
  reached: INTAKE_ARRIVED,
};

// The pickup trip's milestone log as the journey has it. The API doesn't send
// when each step happened, so a step keeps the time it's `known` by, or gets now.
export function journeyPickupProgress(
  journey: BookingJourney,
  known: MilestoneLog<ValetMilestone> = {},
): MilestoneLog<ValetMilestone> {
  const progress: MilestoneLog<ValetMilestone> = {};
  LEG_MILESTONES.pickup.forEach((milestone) => {
    const step = PICKUP_JOURNEY_STEPS[milestone];
    if (step && journeyReached(journey, step)) {
      progress[milestone] = known[milestone] ?? new Date().toISOString();
    }
  });
  return progress;
}

// The service on the journey, as the Service Details step shows it. The API
// has more steps in between (inspection completed / approved, service completed);
// they're left out.
export const SERVICE_JOURNEY = [
  "advisorAssigned",
  "vehicleInInspection",
  "vehicleInService",
  "invoiceGenerated",
  "paymentConfirmed",
  "readyForDispatch",
] as const;

// The advisor's last step (the bill), then the admin's two that end the service
export const SERVICE_INVOICED = "invoiceGenerated";
export const SERVICE_PAID = "paymentConfirmed";
export const SERVICE_READY = "readyForDispatch";

const SERVICE_JOURNEY_STEPS: Record<AdvisorMilestone, string> = {
  inspecting: "vehicleInInspection",
  inService: "vehicleInService",
  readyForDispatch: SERVICE_READY,
};

// The advisor's milestone log as the journey has it (see journeyPickupProgress)
export function journeyAdvisorProgress(
  journey: BookingJourney,
  known: MilestoneLog<AdvisorMilestone> = {},
): MilestoneLog<AdvisorMilestone> {
  const progress: MilestoneLog<AdvisorMilestone> = {};
  (Object.keys(SERVICE_JOURNEY_STEPS) as AdvisorMilestone[]).forEach((milestone) => {
    if (journeyReached(journey, SERVICE_JOURNEY_STEPS[milestone])) {
      progress[milestone] = known[milestone] ?? new Date().toISOString();
    }
  });
  return progress;
}

// A booking as the admin API returns it
export interface AdminBooking {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  serviceId: ServiceId;
  vehicle: {
    brand: string;
    model: string;
    year: number;
    vin: string;
    // The vehicle's photo, when the API sends one
    image?: string;
  };
  pickup: string;
  dealershipName: string;
  driveable: boolean;
  // The customer asked for a tow truck (the API's `towRequested`). false for a
  // vehicle that isn't driveable means they took the tow truck off.
  towTruck?: boolean;
  concern: string;
  scheduledAt: string | null;
  createdAt: string;
  status: BookingStatus;
  // Minutes until the valet reaches the customer, sent while they're on the way
  etaMinutes?: number | null;
  confirmedAt: string | null;
  // Not picked yet when missing (bookings from before it existed have a valet instead)
  intakeMethod?: IntakeMethod | null;
  // Pickup valet (the API calls it just "valet")
  valet: StaffMember | null;
  pickupProgress?: MilestoneLog<ValetMilestone>;
  relationshipManager: StaffMember | null;
  advisorProgress?: MilestoneLog<AdvisorMilestone>;
  payment: PaymentInfo | null;
  // Set when the bill is generated
  invoice?: Invoice | null;
  // How the vehicle goes back: "valet" or "selfDrive" (the customer collects it)
  handoverMethod?: IntakeMethod | null;
  // Brings the vehicle back once the bill is paid
  deliveryValet?: StaffMember | null;
  deliveryProgress?: MilestoneLog<ValetMilestone>;
  // When each valet / the advisor was assigned (ISO strings), for the first
  // step of their progress
  assignedAt?: Partial<Record<StaffLinkRole, string>>;
  completedAt?: string | null;
  // Where the booking is on the API's journey; the Vehicle Intake step is drawn from it
  journey?: BookingJourney;
  // What goes in each staff link's search params (see staffLink in
  // admin.utils.ts). Only admin responses carry it; it's what signs the valet /
  // advisor in without the email + OTP form.
  staffTokens?: Partial<Record<StaffLinkRole, StaffAuth>>;
}

// A step of a staff page's progress timeline, with when it was done (text ready
// to show)
export interface StaffStep {
  key: string;
  label: string;
  done: boolean;
  at?: string;
}

// The update a staff member can make now
export interface StaffNextAction {
  status: string;
  label: string;
}

// A booking's service as its advisor sees it, from staff/advisor/bookings/:bmsId
export interface AdvisorServiceDetails {
  id: string;
  vehicle: { name: string; vin: string };
  customer: { name: string; phone: string };
  // "Oct 9, 2026, 7:56 AM"
  bookingDate: string;
  // The API's label for the booking's status
  status: string;
  steps: StaffStep[];
  // null when it isn't the advisor's turn, or the bill is what's next
  nextAction: StaffNextAction | null;
  // The service is at the point where the advisor sends the bill
  canGenerateInvoice: boolean;
  invoice: { items: InvoiceLine[]; total: number; generatedAt?: string } | null;
}

// One trip of a booking as its valet sees it, from staff/valet/bookings/:bmsId.
// Everything arrives as text ready to show.
export interface ValetTripDetails {
  id: string;
  leg: ValetLeg;
  // "Pickup Trip"
  title: string;
  vehicle: { name: string; vin: string };
  // "As soon as possible", or the date and time
  scheduled: string;
  // The API's label for the booking's status
  status: string;
  // Where the trip starts and ends; the customer's stop carries their number
  from: { label: string; address: string; phone?: string };
  to: { label: string; address: string; phone?: string };
  // The trip's steps in order
  steps: StaffStep[];
  // null when it isn't the valet's turn
  nextAction: StaffNextAction | null;
}

// A row of the admin bookings table, from booking/admin/list. The API sends the
// vehicle, service and scheduled time as text ready to show.
export interface AdminBookingRow {
  id: string;
  customerName: string;
  customerPhone: string;
  // e.g. "2026 RAM 1500"
  vehicle: string;
  service: string;
  // e.g. "Oct 12, 12:30 PM"
  scheduled: string;
  // For the badge colour; null when the API's status isn't one the app knows
  status: BookingStatus | null;
  statusLabel: string;
}

export type SortOrder = "asc" | "desc";

export interface BookingListParams {
  page: number;
  pageSize: number;
  search: string;
  status: BookingStatus | "all";
  serviceId: ServiceId | "all";
}

export type StaffSortField = "name" | "email" | "phone" | "available";

export type StaffAvailability = "all" | "available" | "busy";

export interface StaffListParams {
  page: number;
  pageSize: number;
  sortBy: StaffSortField;
  sortOrder: SortOrder;
  search: string;
  availability: StaffAvailability;
}

// Rows per page in every admin table
export const ADMIN_PAGE_SIZE = 10;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
