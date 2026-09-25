import { Plus } from "reicon-react";
import { SearchInput } from "@/components/features/admin/SearchInput";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  resetStaffFilters,
  selectStaffListParams,
  setStaffAvailability,
  setStaffSearch,
} from "@/redux/adminStaff/adminStaffSlice";
import { openAddStaffMember } from "@/redux/modals/staffModal/staffModalSlice";
import type { StaffAvailability, StaffRole } from "@/types/admin";
import { availabilityOptions, staffRoleLabels } from "./staff.utils";

export function StaffToolbar({ role }: { role: StaffRole }) {
  const dispatch = useAppDispatch();
  const { search, availability } = useAppSelector((state) => selectStaffListParams(state, role));
  const roleLabel = staffRoleLabels[role];

  const hasFilters = search !== "" || availability !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={search}
        onSearch={(value) => dispatch(setStaffSearch({ role, value }))}
        placeholder={`Search ${roleLabel}s by name or phone`}
      />

      {/* Availability */}
      <select
        value={availability}
        onChange={(event) =>
          dispatch(
            setStaffAvailability({ role, value: event.target.value as StaffAvailability }),
          )
        }
        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
        aria-label="Filter by availability"
      >
        {availabilityOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => dispatch(resetStaffFilters(role))}
          className="h-9 rounded-lg px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        >
          Clear filters
        </button>
      )}

      <button
        type="button"
        onClick={() => dispatch(openAddStaffMember())}
        className="flex h-9 items-center gap-1.5 rounded-lg bg-black px-4 text-sm font-semibold capitalize text-white transition hover:bg-gray-800"
      >
        <Plus size={16} strokeWidth={2.5} />
        Add {roleLabel}
      </button>
    </div>
  );
}
