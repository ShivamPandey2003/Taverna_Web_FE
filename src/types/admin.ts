import type { BookingStatus } from "./booking";
import type { ServiceId } from "./service";

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  available: boolean;
}

export type PaymentMethod = "card" | "cash" | "insurance" | "warranty";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface PaymentInfo {
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId: string;
  updatedAt: string;
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
  confirmedAt: string | null;
  valet: StaffMember | null;
  relationshipManager: StaffMember | null;
  payment: PaymentInfo | null;
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

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
