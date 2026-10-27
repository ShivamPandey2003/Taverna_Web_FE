import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeDeleteDealership,
  selectDealershipModal,
} from "@/redux/modals/dealershipModal/dealershipModalSlice";
import { useDeleteDealership } from "@/services/queries/dealershipQueries";

// Asks before deleting the dealership a card's Delete button picked
export function DeleteDealershipModal() {
  const dispatch = useAppDispatch();
  const { deleting } = useAppSelector(selectDealershipModal);
  const deleteDealership = useDeleteDealership();

  if (!deleting) return null;

  const close = () => {
    if (!deleteDealership.isPending) dispatch(closeDeleteDealership());
  };

  const handleConfirm = () => {
    deleteDealership.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`${deleting.name} deleted`);
        dispatch(closeDeleteDealership());
      },
    });
  };

  return (
    <ConfirmModal
      testId="delete-dealership-modal"
      title="Delete Dealership"
      subtitle={deleting.address}
      pending={deleteDealership.isPending}
      onConfirm={handleConfirm}
      onClose={close}
    >
      Delete <span className="font-semibold text-gray-900">{deleting.name}</span>? Customers
      won't be able to pick it any more. This can't be undone.
    </ConfirmModal>
  );
}
