import { toast } from "sonner";
import { AddressCard } from "./AddressCard";
import type { Address } from "@/types/address";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  deleteAddress,
  selectAddresses,
  setDefaultAddress,
} from "@/redux/address/addressSlice";
import { openEditAddress } from "@/redux/modals/accountModal/accountModalSlice";

export function AddressList() {
  const dispatch = useAppDispatch();
  const addresses = useAppSelector(selectAddresses);

  const handleEdit = (address: Address) => {
    dispatch(openEditAddress(address.id));
  };

  const handleDelete = (address: Address) => {
    dispatch(deleteAddress(address.id));
    toast.success("Address deleted");
  };

  const handleSetDefault = (address: Address) => {
    dispatch(setDefaultAddress(address.id));
  };

  if (addresses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-500">
        No saved addresses yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <AddressCard
          key={address.id}
          address={address}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
        />
      ))}
    </div>
  );
}
