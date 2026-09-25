import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeStaffForm,
  resetStaffModals,
  selectStaffModal,
} from "@/redux/modals/staffModal/staffModalSlice";
import type { StaffRole } from "@/types/admin";
import { DeleteStaffModal } from "./DeleteStaffModal";
import { StaffFormModal } from "./StaffFormModal";
import { StaffTable } from "./StaffTable";
import { StaffToolbar } from "./StaffToolbar";
import { staffPageTitles, staffRoleLabels } from "./staff.utils";

// Searchable, sortable list of one kind of staff with add, edit and delete
export function StaffDirectory({ role }: { role: StaffRole }) {
  const dispatch = useAppDispatch();
  const { formOpen, editing } = useAppSelector(selectStaffModal);

  // Both staff pages share the modal slice; don't carry an open modal across
  useEffect(() => () => void dispatch(resetStaffModals()), [dispatch]);

  return (
    <main className="min-h-0 h-full overflow-auto bg-[#f8f9fa] px-6 py-4 lg:px-10">
      <div className="mx-auto space-y-3">
        {/* Page header */}
        <header className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            {staffPageTitles[role]}
          </h1>

          <p className="text-sm text-gray-500">
            Add, edit or remove the {staffRoleLabels[role]}s you can assign to bookings.
          </p>
        </header>

        <StaffToolbar role={role} />

        <StaffTable role={role} />
      </div>

      <StaffFormModal
        open={formOpen}
        role={role}
        member={editing}
        onClose={() => dispatch(closeStaffForm())}
      />
      <DeleteStaffModal role={role} />
    </main>
  );
}
