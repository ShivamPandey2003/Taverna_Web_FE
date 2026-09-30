import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeDeleteDealership,
  selectDealershipModal,
} from "@/redux/modals/dealershipModal/dealershipModalSlice";
import { useDeleteDealership } from "@/services/queries/adminQueries";

export function DeleteDealershipModal() {
  const dispatch = useAppDispatch();
  const { deleting } = useAppSelector(selectDealershipModal);
  const deleteDealership = useDeleteDealership();

  if (!deleting) {
    return null;
  }

  const onClose = () => dispatch(closeDeleteDealership());

  // The API refuses while it has active bookings; that error is toasted for us
  const handleDelete = () => {
    deleteDealership.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`${deleting.name} deleted`);
        onClose();
      },
    });
  };

  return (
    <ConfirmModal
      title="Delete Dealership"
      onClose={onClose}
      onConfirm={handleDelete}
      pending={deleteDealership.isPending}
    >
      Are you sure you want to delete{" "}
      <span className="font-semibold text-gray-900">{deleting.name}</span>? Customers won't be
      able to choose it for new bookings, and this can't be undone.
    </ConfirmModal>
  );
}
