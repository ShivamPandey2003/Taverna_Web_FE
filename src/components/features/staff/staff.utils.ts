import type {
  Paginated,
  StaffAvailability,
  StaffListParams,
  StaffMember,
  StaffRole,
} from "@/types/admin";

export const staffRoleLabels: Record<StaffRole, string> = {
  valet: "valet",
  manager: "advisor",
};

export const staffPageTitles: Record<StaffRole, string> = {
  valet: "Valets",
  manager: "Advisors",
};

export const availabilityOptions: { value: StaffAvailability; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
];

// One page of the staff table. The API searches and filters, then sends every
// match at once, so sorting and paging are done here.
export function staffPage(staff: StaffMember[], params: StaffListParams): Paginated<StaffMember> {

  const sortValue = (member: StaffMember) => {
    switch (params.sortBy) {
      case "email":
        return member.email.toLowerCase();
      case "phone":
        return member.phone;
      case "available":
        return member.available ? 1 : 0;
      default:
        return member.name.toLowerCase();
    }
  };

  const direction = params.sortOrder === "asc" ? 1 : -1;
  const sorted = [...staff].sort((first, second) =>
    sortValue(first) < sortValue(second)
      ? -direction
      : sortValue(first) > sortValue(second)
        ? direction
        : 0,
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / params.pageSize));
  const page = Math.min(params.page, totalPages);
  const start = (page - 1) * params.pageSize;

  return {
    items: sorted.slice(start, start + params.pageSize),
    total: sorted.length,
    page,
    pageSize: params.pageSize,
    totalPages,
  };
}
