import type { StaffAvailability, StaffRole } from "@/types/admin";

export const staffRoleLabels: Record<StaffRole, string> = {
  valet: "valet",
  manager: "relationship manager",
};

export const staffPageTitles: Record<StaffRole, string> = {
  valet: "Valets",
  manager: "Relationship Managers",
};

export const availabilityOptions: { value: StaffAvailability; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
];
