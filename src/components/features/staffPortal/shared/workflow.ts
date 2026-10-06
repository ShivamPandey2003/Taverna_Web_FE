import { VALET_LEGS, type AdvisorMilestone, type StaffBooking, type ValetLeg, type ValetMilestone } from "@/types/admin";

// Button text for posting each milestone. The milestone names themselves are
// shared with the admin (valetMilestoneLabels / advisorMilestoneLabels in
// admin.utils.ts), so staff, admin and customer all see the same words.
export const valetActions: Record<ValetLeg, Record<ValetMilestone, string>> = {
  pickup: {
    dispatched: "Start Trip to Customer",
    arrived: "I've Arrived",
    pickedUp: "Vehicle Picked Up",
    enRoute: "Heading to Dealership",
    reached: "Arrived at Dealership",
    delivered: "Hand Over to Dealership",
  },
  delivery: {
    dispatched: "Start Trip to Customer",
    arrived: "I've Arrived",
    pickedUp: "Vehicle Picked Up",
    enRoute: "Heading to Customer",
    reached: "Arrived at Customer",
    delivered: "Deliver to Customer",
  },
};

export const advisorActions: Record<AdvisorMilestone, string> = {
  inspecting: "Start Inspection",
  inService: "Start Service",
  // The last update, once the invoice is paid: unlocks the delivery valet
  readyForDispatch: "Vehicle Ready to Dispatch",
};

export const tripTitles: Record<ValetLeg, string> = {
  pickup: "Pickup Trip",
  delivery: "Delivery Trip",
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
