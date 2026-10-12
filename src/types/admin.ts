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
  // Encrypted staff type ("valet" or "advisor"); only the server can read it
  token: string;
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
// A trip with a single choice needs no picking: see `legMethod` in admin.utils.ts.
export const LEG_METHODS: Record<ServiceId, Record<ValetLeg, readonly IntakeMethod[]>> = {
  "pickup-delivery": { pickup: ["valet", "towTruck"], delivery: ["valet"] },
  "loaner-only": { pickup: ["selfDrive"], delivery: ["selfDrive"] },
};

// Updates the advisor shares with the customer while the vehicle is serviced, in
// order. The bill and payment that follow come from `invoice` and `payment`; then
// the advisor hands the vehicle over for the delivery valet (`ADVISOR_HANDOVER`).
export const ADVISOR_MILESTONES = ["inspecting", "inService"] as const;
export const ADVISOR_HANDOVER = "readyForDispatch";
export type AdvisorMilestone = (typeof ADVISOR_MILESTONES)[number] | typeof ADVISOR_HANDOVER;

// When each milestone was reached (ISO strings); missing = not reached yet
export type MilestoneLog<T extends string> = Partial<Record<T, string>>;

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
  // Only for a vehicle that isn't driveable: false when the customer took the tow
  // truck off (they get the vehicle to the dealership themselves)
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
  // What goes in each staff link's search params (see staffLink in
  // admin.utils.ts). Only admin responses carry it; it's what signs the valet /
  // advisor in without the email + OTP form.
  staffTokens?: Partial<Record<StaffLinkRole, StaffAuth>>;
}

// A booking as the staff link endpoints return it
export interface StaffBooking extends AdminBooking {
  // The pages of this booking the signed-in staff member may use; a valet can't
  // open the advisor's page, nor the pickup valet the delivery trip
  linkRoles?: StaffLinkRole[];
  // The valet's directions fall back to the dealership's name without it
  dealershipAddress?: string;
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

export type BookingSortField =
  | "id"
  | "customer"
  | "createdAt"
  | "scheduledAt"
  | "status";

export type SortOrder = "asc" | "desc";

export interface BookingListParams {
  page: number;
  pageSize: number;
  sortBy: BookingSortField;
  sortOrder: SortOrder;
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
