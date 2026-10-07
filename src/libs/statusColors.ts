import { BookingStatus } from "@/types/booking";

export interface StatusColor {
  // Light badge (admin tables)
  soft: string;
  // Coloured text on white (status toast, notices)
  text: string;
  // Light-to-deep stops of the tracking header's coloured side
  gradient: string;
}

// Statuses share a colour per stage of the service.
// Full class names so Tailwind generates them.

// Request: waiting for the dealership
const request: StatusColor = {
  soft: "bg-[#64748B]/10 text-[#64748B]",
  text: "text-[#64748B]",
  gradient: "from-[#64748B] to-slate-700",
};

// Confirmation and pickup
const pickup: StatusColor = {
  soft: "bg-[#2563EB]/10 text-[#2563EB]",
  text: "text-[#2563EB]",
  gradient: "from-[#2563EB] to-blue-800",
};

// At the dealership
const atDealership: StatusColor = {
  soft: "bg-[#B45309]/10 text-[#B45309]",
  text: "text-[#B45309]",
  gradient: "from-[#B45309] to-amber-900",
};

// Action needed from the customer
const actionNeeded: StatusColor = {
  soft: "bg-[#C2410C]/10 text-[#C2410C]",
  text: "text-[#C2410C]",
  gradient: "from-[#C2410C] to-orange-900",
};

// Return trip
const vehicleReturn: StatusColor = {
  soft: "bg-[#0F766E]/10 text-[#0F766E]",
  text: "text-[#0F766E]",
  gradient: "from-[#0F766E] to-teal-900",
};

const done: StatusColor = {
  soft: "bg-[#15803D]/10 text-[#15803D]",
  text: "text-[#15803D]",
  gradient: "from-[#15803D] to-green-900",
};

// One colour per booking status, shared by the admin and customer sides
export const statusColors: Record<BookingStatus, StatusColor> = {
  [BookingStatus.IN_QUEUE]: request,
  [BookingStatus.BOOKED]: pickup,
  [BookingStatus.VALET_ASSIGNED]: pickup,
  [BookingStatus.VALET_ON_ROAD]: pickup,
  [BookingStatus.VEHICLE_PICKED_UP]: pickup,
  [BookingStatus.VEHICLE_ARRIVED]: atDealership,
  [BookingStatus.IN_SERVICE]: atDealership,
  [BookingStatus.BILL_GENERATED]: actionNeeded,
  [BookingStatus.VEHICLE_RETURN]: vehicleReturn,
  [BookingStatus.SERVICE_COMPLETE]: done,
};
