import { useEffect } from "react";
import {
  CalendarTick,
  BillCheck,
  Car,
  CheckCircle,
  Driving,
  Garage,
  Invoice,
  MapPoint,
  People,
  Routing,
  Setting2,
  TickCircle,
  UserLaptop,
  UserTick,
  XCircle2,
} from "reicon-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  activeBookingsRestored,
  bookingVehiclesCorrected,
  selectActiveBookings,
} from "@/redux/tracking/trackingSlice";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import { useMyBookings } from "@/services/queries/bookingQueries";
import defaultVehicleImage from "@/assets/jeep-grand-cherokee.webp";
import { statusColors, type StatusColor } from "@/libs/statusColors";
import { BookingStatus, type Booking, type BookingSummary } from "@/types/booking";
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

// An icon for each of the API's status labels, matched on their letters
// ("Valet EnRoute" = "valetenroute"); both valet legs share their labels
const labelIcons: Record<string, typeof People> = {
  inqueue: People,
  booked: CalendarTick,
  valetready: UserTick,
  valetenroute: Routing,
  valetarrived: MapPoint,
  pickupbooked: Car,
  pickupenroute: Routing,
  atdealership: Garage,
  checkedin: Garage,
  advisorready: UserLaptop,
  inspecting: UserLaptop,
  servicing: Setting2,
  billgenerated: Invoice,
  verifyingpayment: BillCheck,
  paymentverified: CheckCircle,
  ready: Car,
  vehicledelivered: Car,
  servicedone: TickCircle,
  cancelled: XCircle2,
};

// The icon for a status label, else the stage's own icon
export function statusLabelIcon(label: string | null | undefined, status: BookingStatus) {
  const key = label?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  // The delivery valet's "Valet Ready" is driving to the customer
  if (key === "valetready" && status === BookingStatus.VEHICLE_RETURN) return Driving;
  return labelIcons[key] ?? statusIcons[status];
}

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

// How each stage reads to the customer; what the API says about the status (its
// name, and on the tracking page its line about it) replaces the label and message
export function getStatusDisplay(
  status: BookingStatus,
  live?: { label: string; heading?: string },
): StatusDisplay {
  return {
    color: statusColors[status],
    ...getStatusText(status),
    ...(live && { label: live.label }),
    ...(live?.heading && { message: live.heading }),
  };
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

// What the tracking page shows besides the header and the journey:
//   details - what was booked, before anyone is assigned
//   valet   - the map, while a valet is moving the vehicle
//   advisor - the advisor's card, while the vehicle is at the dealership
//   none    - nothing more (the vehicle is on its way back, or the service is done)
export type TrackingStage = "details" | "valet" | "advisor" | "none";

export function getTrackingStage(status: BookingStatus): TrackingStage {
  switch (status) {
    case BookingStatus.IN_QUEUE:
    case BookingStatus.BOOKED:
      return "details";
    case BookingStatus.VALET_ASSIGNED:
    case BookingStatus.VALET_ON_ROAD:
    case BookingStatus.VEHICLE_PICKED_UP:
      return "valet";
    case BookingStatus.VEHICLE_ARRIVED:
    case BookingStatus.IN_SERVICE:
    case BookingStatus.BILL_GENERATED:
      return "advisor";
    default:
      return "none";
  }
}

// One of the customer's tracked bookings with its live status
export interface ActiveService {
  booking: Booking;
  status: BookingStatus;
  display: StatusDisplay;
}

export const isOpenService = (service: ActiveService) =>
  service.status !== BookingStatus.SERVICE_COMPLETE;

// Every booking the customer is tracking, newest first, with where it stands.
// The Redux snapshot says what was booked and covers the first render and API
// failures; the status is the API's, from the customer's list of bookings. One
// the list has as over (complete or cancelled) counts as complete.
export function useActiveServices(): ActiveService[] {
  const bookings = useAppSelector(selectActiveBookings);
  const { data: list } = useMyBookings();

  return bookings.map((booking) => {
    const live = list?.find((item) => item.id === booking.id);
    const status = !live
      ? booking.status
      : live.open
        ? (live.status ?? booking.status)
        : BookingStatus.SERVICE_COMPLETE;
    return { booking, status, display: getStatusDisplay(status, live) };
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

// "2026 RAM 1500" -> year, brand and model
function parseVehicle(name: string) {
  const [first = "", ...rest] = name.trim().split(/\s+/);
  const year = Number(first);
  const [brand = "", ...model] = Number.isNaN(year) ? [first, ...rest] : rest;
  return { year: Number.isNaN(year) ? 0 : year, brand, model: model.join(" ") };
}

// The same vehicle: by VIN, since two vehicles can share a name
const sameVin = (a: string, b: string) => !!a && a.toUpperCase() === b.toUpperCase();

// A tracked booking rebuilt from the API's list, which says little about it: the
// vehicle (matched to the customer's saved ones by VIN), no pickup address and
// no concern
function toTrackingBooking(summary: BookingSummary, vehicles: Vehicle[]): Booking {
  const vehicle: Vehicle = vehicles.find((saved) => sameVin(saved.vin, summary.vin)) ?? {
    id: summary.id,
    ...parseVehicle(summary.vehicle),
    vin: summary.vin,
    miles: "—",
    image: defaultVehicleImage,
  };
  const scheduled = Date.parse(summary.scheduled);
  const scheduledAt = Number.isNaN(scheduled) ? null : new Date(scheduled).toISOString();

  return {
    id: summary.id,
    serviceId: "pickup-delivery",
    vehicle,
    pickup: { label: "" },
    dealership: {
      id: summary.dealershipName,
      name: summary.dealershipName,
      address: "",
      image: "",
      valetAvailable: true,
      loanerAvailable: true,
      latitude: 0,
      longitude: 0,
      serviceRadiusMiles: 0,
      timezone: "",
      isActive: true,
    },
    driveable: true,
    concern: "",
    scheduledAt,
    createdAt: scheduledAt ?? new Date().toISOString(),
    status: summary.status ?? BookingStatus.IN_QUEUE,
  };
}

// Puts back the running bookings that Redux lost (after a reload, or made on
// another device) from the customer's list of bookings. Tracking, the status
// bubbles and the booking pages read them from Redux. Waits for the customer's
// vehicles, which each booking is matched to.
export function useSyncActiveBookings(enabled: boolean) {
  const dispatch = useAppDispatch();
  const activeBookings = useAppSelector(selectActiveBookings);
  const vehicles = useAppSelector(selectVehicles);
  const { data: list } = useMyBookings(enabled);

  useEffect(() => {
    if (!enabled || !list || vehicles.length === 0) return;

    const tracked = new Set(activeBookings.map((booking) => booking.id));
    const missing = list.filter((booking) => booking.open && !tracked.has(booking.id));
    if (missing.length > 0) {
      dispatch(
        activeBookingsRestored(missing.map((booking) => toTrackingBooking(booking, vehicles))),
      );
    }

    // Tracked bookings on a different vehicle than the API says (by VIN) get the
    // saved vehicle with that VIN
    const corrections = activeBookings.flatMap((booking) => {
      const summary = list.find((item) => item.id === booking.id);
      if (!summary?.vin || sameVin(booking.vehicle.vin, summary.vin)) return [];
      const vehicle = vehicles.find((saved) => sameVin(saved.vin, summary.vin));
      return vehicle ? [{ id: booking.id, vehicle }] : [];
    });
    if (corrections.length > 0) dispatch(bookingVehiclesCorrected(corrections));
  }, [dispatch, enabled, list, activeBookings, vehicles]);
}
