import { VALET_LEGS, type AdvisorMilestone, type StaffBooking, type ValetLeg, type ValetMilestone } from "@/types/admin";

// Button text for posting each milestone. The milestone names themselves are
// shared with the admin (valetMilestoneLabels / advisorMilestoneLabels in
// admin.utils.ts), so staff, admin and customer all see the same words.
export const valetActions: Record<ValetLeg, Record<ValetMilestone, string>> = {
  pickup: {
    dispatched: "Start trip to customer",
    arrived: "I've arrived",
    pickedUp: "Vehicle picked up",
    enRoute: "Heading to dealership",
    reached: "Arrived at dealership",
    delivered: "Hand over to dealership",
  },
  delivery: {
    dispatched: "Start trip to dealership",
    arrived: "I've arrived",
    pickedUp: "Vehicle picked up",
    enRoute: "Heading to customer",
    reached: "Arrived at customer",
    delivered: "Deliver to customer",
  },
};

export const advisorActions: Record<AdvisorMilestone, string> = {
  inspecting: "Start inspection",
  inspected: "Finish inspection",
  inService: "Start service",
  serviceDone: "Finish service",
  // The last update, once the invoice is paid: unlocks the delivery valet
  readyForDispatch: "Vehicle ready to dispatch",
};

export const tripTitles: Record<ValetLeg, string> = {
  pickup: "Pickup trip",
  delivery: "Delivery trip",
};

export function isValetLeg(value: string | undefined): value is ValetLeg {
  return VALET_LEGS.includes(value as ValetLeg);
}

// Where a trip starts and ends; the customer's stop carries their number
export function tripRoute(booking: StaffBooking, leg: ValetLeg) {
  const customer = {
    label: booking.customer.name,
    address: booking.pickup,
    phone: booking.customer.phone,
  };
  const dealership = {
    label: booking.dealershipName,
    address: booking.dealershipAddress ?? booking.dealershipName,
  };
  return leg === "pickup"
    ? { from: customer, to: dealership }
    : { from: dealership, to: customer };
}
