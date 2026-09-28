import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeDeleteStaffMember,
  selectStaffModal,
} from "@/redux/modals/staffModal/staffModalSlice";
import { useDeleteStaff } from "@/services/queries/adminQueries";
import type { StaffRole } from "@/types/admin";
import { staffRoleLabels } from "./staff.utils";

export function DeleteStaffModal({ role }: { role: StaffRole }) {
  const dispatch = useAppDispatch();
  const { deleting } = useAppSelector(selectStaffModal);
  const deleteStaff = useDeleteStaff(role);

  if (!deleting) {
    return null;
  }

  const onClose = () => dispatch(closeDeleteStaffMember());

  // The API refuses while they're on an active booking; that error is toasted for us
  const handleDelete = () => {
    deleteStaff.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`${deleting.name} deleted`);
        onClose();
      },
    });
  };

  return (
    <ConfirmModal
      title={<span className="capitalize">Delete {staffRoleLabels[role]}</span>}
      onClose={onClose}
      onConfirm={handleDelete}
      pending={deleteStaff.isPending}
    >
      Are you sure you want to delete{" "}
      <span className="font-semibold text-gray-900">{deleting.name}</span>? They can't be
      assigned to new bookings after this, and this can't be undone.
    </ConfirmModal>
  );
}
