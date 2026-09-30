import { BookingStatus } from "@/types/booking";

export interface StatusColor {
  // Light badge (admin tables)
  soft: string;
  // Coloured text on white (status toast, notices)
  text: string;
  // Gradient end stop (the tracking header fades from white to it)
  gradient: string;
}

const neutral: StatusColor = {
  soft: "bg-gray-100 text-gray-700",
  text: "text-gray-700",
  gradient: "to-gray-700",
};

// One colour per booking status, shared by the admin and customer sides.
// Full class names so Tailwind generates them.
export const statusColors: Record<BookingStatus, StatusColor> = {
  [BookingStatus.IN_QUEUE]: {
    soft: "bg-gray-100 text-gray-600",
    text: "text-gray-600",
    gradient: "to-gray-500",
  },
  [BookingStatus.BOOKED]: {
    soft: "bg-blue-50 text-blue-700",
    text: "text-blue-600",
    gradient: "to-blue-600",
  },
  [BookingStatus.VALET_ASSIGNED]: {
    soft: "bg-gray-100 text-gray-900",
    text: "text-gray-900",
    gradient: "to-gray-800",
  },
  [BookingStatus.VEHICLE_PICKED_UP]: neutral,
  [BookingStatus.VEHICLE_ARRIVED]: neutral,
  [BookingStatus.IN_SERVICE]: neutral,
  [BookingStatus.BILL_GENERATED]: neutral,
  [BookingStatus.VEHICLE_RETURN]: neutral,
  [BookingStatus.SERVICE_COMPLETE]: {
    soft: "bg-emerald-50 text-emerald-700",
    text: "text-status-active",
    gradient: "to-status-active",
  },
};
