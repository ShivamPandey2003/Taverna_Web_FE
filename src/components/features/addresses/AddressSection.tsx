import { AddressList } from "./AddressList";
import { InfoCircle } from "reicon-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAddresses } from "@/redux/address/addressSlice";
import { openAddAddress } from "@/redux/modals/accountModal/accountModalSlice";

export function AddressSection() {
  const dispatch = useAppDispatch();
  const addresses = useAppSelector(selectAddresses);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">Addresses</h2>

          <p className="mt-0.5 text-[11px] text-gray-500">
            Manage your saved addresses.
          </p>
        </div>

        {/* Count */}
        <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
          {addresses.length} addresses
        </span>
      </header>

      {/* Address list */}
      <div className="mt-4">
        <AddressList />
      </div>

      {/* Add address */}
      <button
        type="button"
        onClick={() => dispatch(openAddAddress())}
        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white text-xs font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50"
      >
        <span className="text-base leading-none">+</span>
        Add New Address
      </button>

      {/* Information */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
        <InfoCircle size={14} className="shrink-0 text-gray-500" />

        <p className="text-[10px] text-gray-500">
          Your default address is used for pickup & delivery services.
        </p>
      </div>
    </section>
  );
}
