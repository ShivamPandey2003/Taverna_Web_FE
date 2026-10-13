import type { Address } from "./address";
import type { Dealership } from "./dealership";
import type { ServiceId } from "./service";
import type { Vehicle } from "./vehicle";

export type PickupLocation =
  | { type: "saved"; addressId: string }
  | { type: "current"; label: string };

export const BookingStatus = {
  IN_QUEUE: "In-queue",
  BOOKED: "Booked",
  VALET_ASSIGNED: "Valet Assigned",
  // A valet is on the road: the pickup valet from setting off until they have the
  // vehicle, the delivery valet from setting off until they reach the customer
  VALET_ON_ROAD: "Valet On Road",
  VEHICLE_PICKED_UP: "Vehicle Picked Up",
  VEHICLE_ARRIVED: "Vehicle Arrived",
  IN_SERVICE: "In Service",
  BILL_GENERATED: "Bill Generated",
  VEHICLE_RETURN: "Vehicle Return",
  SERVICE_COMPLETE: "Service Complete",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export interface Booking {
  id: string;
  serviceId: ServiceId;
  vehicle: Vehicle;
  pickup: Pick<Address, "address" | "city" | "state" | "zip"> | { label: string };
  dealership: Dealership;
  driveable: boolean;
  // Only for a vehicle that isn't driveable: false when the customer took the tow truck off
  towTruck?: boolean;
  concern: string;
  // ISO strings keep the Redux state serializable
  scheduledAt: string | null;
  createdAt: string;
  status: BookingStatus;
}

// Where a booking stands for its customer, from the API's service-status
export interface ServiceStatus {
  id: string;
  // The API's status code, e.g. "VALET_DISPATCHED"
  code: string;
  // The stage it belongs to, for the colour and icon; null for a code the app
  // doesn't know
  status: BookingStatus | null;
  // The current status by name ("Advisor Assigned") and the API's line about it
  // ("Your vehicle reached the dealership")
  label: string;
  heading: string;
  // The customer's contact at the dealership, once assigned
  advisor: { name: string; phone: string; email: string } | null;
}

// One of the customer's bookings as booking/list has it: enough for the status
// bubbles, and to put a tracked booking back after a reload
export interface BookingSummary {
  id: string;
  dealershipName: string;
  // "2026 RAM 1500"
  vehicle: string;
  // "Oct 13, 2026, 9:00 AM"
  scheduled: string;
  // The API's status code, its stage (null for a code the app doesn't know) and
  // its name ("Advisor Assigned")
  code: string;
  status: BookingStatus | null;
  label: string;
  // Still running: not complete and not cancelled
  open: boolean;
}
