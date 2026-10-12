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

const phoneDigits = (phone: string) => phone.replace(/\D/g, "");

// One page of the staff table. The API sends everyone of a role at once, so the
// search, the availability filter, sorting and paging are done here.
export function staffPage(staff: StaffMember[], params: StaffListParams): Paginated<StaffMember> {
  const search = params.search.trim().toLowerCase();
  const digits = phoneDigits(search);

  const filtered = staff.filter((member) => {
    if (params.availability === "available" && !member.available) return false;
    if (params.availability === "busy" && member.available) return false;
    if (!search) return true;

    return (
      member.name.toLowerCase().includes(search) ||
      member.email.toLowerCase().includes(search) ||
      (digits !== "" && phoneDigits(member.phone).includes(digits))
    );
  });

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
  const sorted = [...filtered].sort((first, second) =>
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
