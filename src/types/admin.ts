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

export const VALET_MILESTONES = [
  "dispatched",
  // At the pickup point: the customer (pickup) or the dealership (delivery)
  "arrived",
  "pickedUp",
  // Driving the vehicle to its destination
  "enRoute",
  "reached",
  // Vehicle handed over: to the dealership (pickup) or the customer (delivery)
  "delivered",
] as const;
export type ValetMilestone = (typeof VALET_MILESTONES)[number];

// What the advisor shares with the customer while the vehicle is at the dealership.
// The bill and the payment that follow come from `invoice` and `payment`.
export const ADVISOR_MILESTONES = ["checkedIn", "inService", "serviceDone"] as const;
export type AdvisorMilestone = (typeof ADVISOR_MILESTONES)[number];

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
  };
  pickup: string;
  dealershipName: string;
  driveable: boolean;
  concern: string;
  scheduledAt: string | null;
  createdAt: string;
  status: BookingStatus;
  // Minutes until the valet reaches the customer, sent while they're on the way
  etaMinutes?: number | null;
  confirmedAt: string | null;
  // Pickup valet (the API calls it just "valet")
  valet: StaffMember | null;
  pickupProgress?: MilestoneLog<ValetMilestone>;
  relationshipManager: StaffMember | null;
  advisorProgress?: MilestoneLog<AdvisorMilestone>;
  payment: PaymentInfo | null;
  // Set when the bill is generated
  invoice?: Invoice | null;
  // Brings the vehicle back once the bill is paid
  deliveryValet?: StaffMember | null;
  deliveryProgress?: MilestoneLog<ValetMilestone>;
  completedAt?: string | null;
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
