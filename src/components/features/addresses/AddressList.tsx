import { toast } from "sonner";
import { AddressCard } from "./AddressCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Spinner } from "@/components/ui/Spinner";
import type { Address } from "@/types/address";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAddressById, selectAddresses } from "@/redux/address/addressSlice";
import {
  closeDeleteAddress,
  openDeleteAddress,
  openEditAddress,
  selectAccountModal,
} from "@/redux/modals/accountModal/accountModalSlice";
import {
  useAddresses,
  useDeleteAddress,
  useUpdateAddress,
} from "@/services/queries/addressQueries";

export function AddressList() {
  const dispatch = useAppDispatch();
  const addresses = useAppSelector(selectAddresses);
  const { deletingAddressId } = useAppSelector(selectAccountModal);
  const deleting = useAppSelector((state) => selectAddressById(state, deletingAddressId));
  const { isPending, isError, isFetching, refetch } = useAddresses();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  // The address being made the default, while that is saving
  const settingDefaultId = updateAddress.isPending ? updateAddress.variables.id : null;

  // Failures are toasted by the API layer; the list just stays as it was
  const handleSetDefault = ({ id, ...address }: Address) => {
    updateAddress.mutate(
      { id, address: { ...address, isDefault: true } },
      { onSuccess: () => toast.success("Default address updated") },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteAddress.mutate(deleting.id, {
      onSuccess: () => {
        toast.success("Address deleted");
        dispatch(closeDeleteAddress());
      },
    });
  };

  // First load: placeholders the shape of the cards
  if (isPending && addresses.length === 0) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading your addresses">
        {[0, 1].map((item) => (
          <div key={item} className="animate-pulse rounded-xl border border-gray-200 px-3 py-3.5">
            <div className="h-4 w-16 rounded bg-gray-200" />
            <div className="mt-3 h-3 w-2/3 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-1/3 rounded bg-gray-100" />
            <div className="mt-3 h-3 w-1/2 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  // The list never loaded (already toasted): offer another go instead of "none saved"
  if (isError && addresses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-red-200 bg-red-50/50 px-3 py-6 text-center">
        <p className="text-xs font-semibold text-gray-900">We couldn't load your addresses.</p>
        <p className="mt-1 text-[11px] text-gray-500">Check your connection and try again.</p>

        <button
          data-test-id="address-list-retry"
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-3 inline-flex h-8 items-center gap-2 rounded-lg bg-[#111827] px-4 text-[11px] font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isFetching && <Spinner className="h-3 w-3" />}
          {isFetching ? "Retrying..." : "Try Again"}
        </button>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-500">
        No saved addresses yet.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            onEdit={() => dispatch(openEditAddress(address.id))}
            onDelete={() => dispatch(openDeleteAddress(address.id))}
            onSetDefault={handleSetDefault}
            settingDefault={settingDefaultId === address.id}
            disabled={updateAddress.isPending || deleteAddress.isPending}
          />
        ))}
      </div>

      {deleting && (
        <ConfirmModal
          testId="delete-address-modal"
          title="Delete Address"
          confirmLabel="Delete Address"
          pending={deleteAddress.isPending}
          onConfirm={handleDelete}
          // Stays open until the delete has finished
          onClose={() => !deleteAddress.isPending && dispatch(closeDeleteAddress())}
        >
          Delete{" "}
          <span className="font-semibold text-gray-900">
            {deleting.address}, {deleting.city}
          </span>
          ? This can't be undone.
          {deleting.isDefault && " It's your default address for pickup & delivery."}
        </ConfirmModal>
      )}
    </>
  );
}
