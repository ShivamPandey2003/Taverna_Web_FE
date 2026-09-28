import type { StaffAvailability, StaffRole } from "@/types/admin";

export const staffRoleLabels: Record<StaffRole, string> = {
  valet: "valet",
  manager: "advisor",
};

export const staffPageTitles: Record<StaffRole, string> = {
  valet: "Valets",
  manager: "Advisors",
};

export const availabilityOptions: { value: StaffAvailability; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
];
