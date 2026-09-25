import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
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

  // The API refuses while they're on an open booking; that error is toasted for us
  const handleDelete = () => {
    deleteStaff.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`${deleting.name} deleted`);
        onClose();
      },
    });
  };

  return (
    <Modal
      title={<h2 className="capitalize">Delete {staffRoleLabels[role]}</h2>}
      onClose={onClose}
      width="max-w-[440px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteStaff.isPending}
            className="h-10 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleteStaff.isPending ? "Deleting..." : "Delete"}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600">
        Delete <span className="font-semibold text-gray-900">{deleting.name}</span>? They can't be
        assigned to new bookings after this. Bookings they already finished keep their name.
      </p>
    </Modal>
  );
}
