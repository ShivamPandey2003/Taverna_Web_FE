import { useEffect } from "react";
import {
  CalendarTick,
  Car,
  Driving,
  Garage,
  Invoice,
  People,
  Routing,
  Setting2,
  TickCircle,
  UserTick,
} from "reicon-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  activeBookingsRestored,
  selectActiveBookings,
  setBookingStatus,
} from "@/redux/tracking/trackingSlice";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import { useMyOpenBookings } from "@/services/queries/bookingQueries";
import { dealerships } from "@/components/features/review/dealership.data";
import defaultVehicleImage from "@/assets/jeep-grand-cherokee.webp";
import { statusColors, type StatusColor } from "@/libs/statusColors";
import type { AdminBooking } from "@/types/admin";
import { BookingStatus, type Booking } from "@/types/booking";
import type { Vehicle } from "@/types/vehicle";

export const TRACKING_PATH = "/dashboard/book-service/tracking";
// The tracking page of one booking; the bare path shows the newest running one.
// Must match the route in routes/index.tsx.
export const trackingPath = (bookingId: string) => `${TRACKING_PATH}/${bookingId}`;
export const TRACKING_ROUTE = `${TRACKING_PATH}/:bookingId?`;

// An icon for each booking status, shown beside its name
export const statusIcons: Record<BookingStatus, typeof People> = {
  [BookingStatus.IN_QUEUE]: People,
  [BookingStatus.BOOKED]: CalendarTick,
  [BookingStatus.VALET_ASSIGNED]: UserTick,
  [BookingStatus.VALET_ON_ROAD]: Routing,
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
      return { label: "Valet assigned", message: "Your valet has been assigned", etaMinutes: eta };
    case BookingStatus.VALET_ON_ROAD:
      return { label: "On the way", message: "Your valet is on the way", etaMinutes: eta };
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

// One of the customer's tracked bookings with its live status
export interface ActiveService {
  booking: Booking;
  status: BookingStatus;
  display: StatusDisplay;
}

export const isOpenService = (service: ActiveService) =>
  service.status !== BookingStatus.SERVICE_COMPLETE;

// Every booking the customer is tracking (one per vehicle), newest first, with
// its live status. The Redux snapshots cover the first render and API failures;
// the open-bookings list (polled) brings admin progress in.
export function useActiveServices(): ActiveService[] {
  const bookings = useAppSelector(selectActiveBookings);
  const { data: open } = useMyOpenBookings();

  return bookings.map((booking) => {
    const live = open?.find((item) => item.id === booking.id);
    const status = live?.status ?? booking.status;
    return { booking, status, display: getStatusDisplay(status, live?.etaMinutes) };
  });
}

// The booking the tracking page shows: the one in its URL, or without one the
// newest that's still running (else the newest of all)
export function pickTrackedService(services: ActiveService[], bookingId?: string) {
  if (bookingId) return services.find((service) => service.booking.id === bookingId) ?? null;
  return services.find(isOpenService) ?? services[0] ?? null;
}

// The unfinished service of one vehicle, if it has one: that vehicle can't be
// booked again until it's complete (other vehicles can). The server enforces the
// same rule.
export function useVehicleService(vin: string | undefined) {
  const services = useActiveServices();
  if (!vin) return null;
  return (
    services.find((service) => service.booking.vehicle.vin === vin && isOpenService(service)) ??
    null
  );
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
    towTruck: booking.towTruck,
    concern: booking.concern,
    scheduledAt: booking.scheduledAt,
    createdAt: booking.createdAt,
    status: booking.status,
  };
}

// Keeps the tracked bookings in Redux in step with the customer's open bookings
// from the API: puts back the ones missing there (after a reload, or made on
// another device), follows their status, and marks as complete the ones the API
// no longer lists. Tracking, the toast and the booking pages read them from Redux.
export function useSyncActiveBookings(enabled: boolean) {
  const dispatch = useAppDispatch();
  const activeBookings = useAppSelector(selectActiveBookings);
  const vehicles = useAppSelector(selectVehicles);
  const { data: openBookings, dataUpdatedAt } = useMyOpenBookings(enabled);

  useEffect(() => {
    if (!enabled || !openBookings) return;

    const tracked = new Set(activeBookings.map((booking) => booking.id));
    const missing = openBookings.filter((booking) => !tracked.has(booking.id));
    if (missing.length > 0) {
      dispatch(
        activeBookingsRestored(missing.map((booking) => toTrackingBooking(booking, vehicles))),
      );
    }

    activeBookings.forEach((booking) => {
      const live = openBookings.find((item) => item.id === booking.id);
      if (live) {
        if (live.status !== booking.status) {
          dispatch(setBookingStatus({ id: booking.id, status: live.status }));
        }
        return;
      }
      // Not open any more. A booking made after the list was fetched just isn't in it yet.
      const listedSince = Date.parse(booking.createdAt) < dataUpdatedAt;
      if (listedSince && booking.status !== BookingStatus.SERVICE_COMPLETE) {
        dispatch(setBookingStatus({ id: booking.id, status: BookingStatus.SERVICE_COMPLETE }));
      }
    });
  }, [dispatch, enabled, openBookings, dataUpdatedAt, activeBookings, vehicles]);
}
