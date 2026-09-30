import { useEffect } from "react";
import {
  CalendarTick,
  Car,
  Driving,
  Garage,
  Invoice,
  People,
  Setting2,
  TickCircle,
  UserTick,
} from "reicon-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  activeBookingRestored,
  selectActiveBooking,
} from "@/redux/tracking/trackingSlice";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import { useMyBooking, useMyOpenBooking } from "@/services/queries/bookingQueries";
import { dealerships } from "@/components/features/review/dealership.data";
import defaultVehicleImage from "@/assets/jeep-grand-cherokee.webp";
import { statusColors, type StatusColor } from "@/libs/statusColors";
import type { AdminBooking } from "@/types/admin";
import { BookingStatus, type Booking } from "@/types/booking";
import type { Vehicle } from "@/types/vehicle";

export const TRACKING_PATH = "/dashboard/book-service/tracking";

// An icon for each booking status, shown beside its name
export const statusIcons: Record<BookingStatus, typeof People> = {
  [BookingStatus.IN_QUEUE]: People,
  [BookingStatus.BOOKED]: CalendarTick,
  [BookingStatus.VALET_ASSIGNED]: UserTick,
  [BookingStatus.VEHICLE_PICKED_UP]: Car,
  [BookingStatus.VEHICLE_ARRIVED]: Garage,
  [BookingStatus.IN_SERVICE]: Setting2,
  [BookingStatus.BILL_GENERATED]: Invoice,
  [BookingStatus.VEHICLE_RETURN]: Driving,
  [BookingStatus.SERVICE_COMPLETE]: TickCircle,
};

export interface StatusDisplay {
  // Same colour as the admin's status badge
  color: StatusColor;
  // Short label on the right, e.g. "Pending", "In service", "Pay now"
  label: string;
  // Line under the vehicle, e.g. "Waiting for confirmation"
  message: string;
  // Shows "Arriving in N mins" instead of the label while the vehicle is on the way
  etaMinutes?: number;
  // The customer has something to do (pay the bill)
  actionRequired?: boolean;
}

// How each booking status reads to the customer
export function getStatusDisplay(status: BookingStatus, etaMinutes?: number | null): StatusDisplay {
  return { color: statusColors[status], ...getStatusText(status, etaMinutes) };
}

function getStatusText(status: BookingStatus, etaMinutes?: number | null): Omit<StatusDisplay, "color"> {
  const eta = etaMinutes != null && etaMinutes > 0 ? Math.round(etaMinutes) : undefined;

  switch (status) {
    case BookingStatus.IN_QUEUE:
      return { label: "Pending", message: "Waiting for confirmation" };
    case BookingStatus.BOOKED:
      return { label: "Confirmed", message: "Your booking is confirmed" };
    case BookingStatus.VALET_ASSIGNED:
      return { label: "Valet assigned", message: "Your valet is on the way", etaMinutes: eta };
    case BookingStatus.VEHICLE_PICKED_UP:
      return { label: "Picked up", message: "Your vehicle is headed to the dealership" };
    case BookingStatus.VEHICLE_ARRIVED:
      return { label: "At dealer", message: "Your vehicle reached the dealership" };
    case BookingStatus.IN_SERVICE:
      return { label: "In service", message: "Your vehicle is in service" };
    case BookingStatus.BILL_GENERATED:
      return { label: "Pay now", message: "Your bill is ready", actionRequired: true };
    case BookingStatus.VEHICLE_RETURN:
      return { label: "Returning", message: "Your vehicle is coming back to you", etaMinutes: eta };
    case BookingStatus.SERVICE_COMPLETE:
      return { label: "Completed", message: "Your service is complete" };
  }
}

// What the tracking page shows, driven by what the admin has done so far:
//   waiting  - nothing assigned yet
//   valet    - pickup valet card + map, until the vehicle reaches the dealership
//   manager  - advisor card while the vehicle is serviced
//   payment  - advisor card + bill
//   delivery - delivery valet card + map + receipt, once the bill is paid
//   complete - bill only
export type TrackingStage = "waiting" | "valet" | "manager" | "payment" | "delivery" | "complete";

export function getTrackingStage(booking: AdminBooking, status: BookingStatus): TrackingStage {
  if (status === BookingStatus.SERVICE_COMPLETE) return "complete";
  if (booking.deliveryValet) return "delivery";
  if (booking.payment || booking.invoice) return "payment";
  if (booking.relationshipManager) return "manager";
  if (booking.valet) return "valet";
  return "waiting";
}

// The customer's current booking with its live status. The Redux snapshot covers
// the first render and API failures; the API (polled) brings admin progress in.
export function useActiveService() {
  const booking = useAppSelector(selectActiveBooking);
  const { data: live } = useMyBooking(booking?.id ?? null);

  if (!booking) {
    return null;
  }

  const status = live?.status ?? booking.status;

  return {
    booking,
    status,
    display: getStatusDisplay(status, live?.etaMinutes),
  };
}

// True while the customer has a booking that isn't complete; they can't book another.
// The API answer survives reloads; the Redux snapshot covers the gap right after booking
// (before the next poll) and API failures. The server enforces the same rule.
export function useServiceInProgress() {
  const service = useActiveService();
  const { data: openBooking } = useMyOpenBooking();

  const snapshotOpen = !!service && service.status !== BookingStatus.SERVICE_COMPLETE;

  return !!openBooking || snapshotOpen;
}

// Tracking data for a booking from the API, using the customer's saved vehicle and the
// dealership catalog where they match
function toTrackingBooking(booking: AdminBooking, vehicles: Vehicle[]): Booking {
  const vehicle: Vehicle = vehicles.find((item) => item.vin === booking.vehicle.vin) ?? {
    id: booking.vehicle.vin,
    ...booking.vehicle,
    miles: "—",
    image: defaultVehicleImage,
  };

  const dealership = dealerships.find((item) => item.name === booking.dealershipName) ?? {
    id: booking.dealershipName,
    name: booking.dealershipName,
    address: "",
    image: "",
    valetAvailable: true,
    loanerAvailable: true,
  };

  return {
    id: booking.id,
    serviceId: booking.serviceId,
    vehicle,
    pickup: { label: booking.pickup },
    dealership,
    driveable: booking.driveable,
    concern: booking.concern,
    scheduledAt: booking.scheduledAt,
    createdAt: booking.createdAt,
    status: booking.status,
  };
}

// Puts the customer's open booking back into Redux when it's missing there (after a
// reload, or a booking made on another device) so tracking, the toast and the sidebar
// card keep working
export function useSyncActiveBooking(enabled: boolean) {
  const dispatch = useAppDispatch();
  const activeBooking = useAppSelector(selectActiveBooking);
  const vehicles = useAppSelector(selectVehicles);
  const { data: openBooking } = useMyOpenBooking(enabled);

  useEffect(() => {
    if (enabled && openBooking && openBooking.id !== activeBooking?.id) {
      dispatch(activeBookingRestored(toTrackingBooking(openBooking, vehicles)));
    }
  }, [dispatch, enabled, openBooking, activeBooking?.id, vehicles]);
}
