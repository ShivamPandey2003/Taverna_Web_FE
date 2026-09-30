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
  VEHICLE_PICKED_UP: "Vehicle Picked Up",
  VEHICLE_ARRIVED: "Vehicle Arrived",
  IN_SERVICE: "In Service",
  BILL_GENERATED: "Bill Generated",
  VEHICLE_RETURN: "Vehicle Return",
  SERVICE_COMPLETE: "Service complete",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export interface Booking {
  id: string;
  serviceId: ServiceId;
  vehicle: Vehicle;
  pickup: Pick<Address, "address" | "city" | "state" | "zip"> | { label: string };
  dealership: Dealership;
  driveable: boolean;
  concern: string;
  // ISO strings keep the Redux state serializable
  scheduledAt: string | null;
  createdAt: string;
  status: BookingStatus;
}
