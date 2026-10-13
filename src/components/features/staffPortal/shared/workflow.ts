import { VALET_LEGS, type AdvisorMilestone, type ValetLeg } from "@/types/admin";

// Button text for posting each milestone. The milestone names themselves are
// shared with the admin (advisorMilestoneLabels in admin.utils.ts), so staff,
// admin and customer all see the same words. The valet's come from the API.
export const advisorActions: Record<AdvisorMilestone, string> = {
  inspecting: "Start Inspection",
  inService: "Start Service",
  // The last update, once the invoice is paid: unlocks the delivery valet
  readyForDispatch: "Vehicle Ready to Dispatch",
};

export function isValetLeg(value: string | undefined): value is ValetLeg {
  return VALET_LEGS.includes(value as ValetLeg);
}
