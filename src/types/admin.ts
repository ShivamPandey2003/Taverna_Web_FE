import type { BookingStatus } from "./booking";
import type { ServiceId } from "./service";

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  available: boolean;
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
  valet: StaffMember | null;
  relationshipManager: StaffMember | null;
  payment: PaymentInfo | null;
  // Set when the bill is generated
  invoice?: Invoice | null;
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

export type StaffSortField = "name" | "phone" | "available";

export type StaffAvailability = "all" | "available" | "busy";

export interface StaffListParams {
  page: number;
  pageSize: number;
  sortBy: StaffSortField;
  sortOrder: SortOrder;
  search: string;
  availability: StaffAvailability;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
