import { Building, HomeSmile, Pen, Pin, Star, Trash2 } from "reicon-react";

import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/libs/utils";
import type { Address, AddressType } from "@/types/address";

interface AddressCardProps {
  address: Address;
  onEdit?: (address: Address) => void;
  onDelete?: (address: Address) => void;
  onSetDefault?: (address: Address) => void;
  // This address is being made the default
  settingDefault?: boolean;
  // A change to the addresses is being saved: its actions wait
  disabled?: boolean;
}

const typeIcons: Record<AddressType, typeof Pin> = {
  home: HomeSmile,
  work: Building,
  other: Pin,
};

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  settingDefault = false,
  disabled = false,
}: AddressCardProps) {
  const TypeIcon = typeIcons[address.type];

  return (
    <article
      aria-busy={settingDefault}
      className={cn(
        "rounded-xl border border-gray-200 bg-white px-3 py-3.5 transition",
        settingDefault && "border-gray-400",
      )}
    >
      {/* Top */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TypeIcon
            size={16}
            strokeWidth={2}
            className="text-gray-600"
          />

          <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[10px] font-semibold capitalize text-white">
            {address.type}
          </span>
        </div>

        {address.isDefault && (
          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-black">
            Default
          </span>
        )}
      </div>

      {/* Address */}
      <div className="mt-3">
        <p className="text-xs font-bold text-gray-900">
          {address.address}
          {address.apartment ? `, ${address.apartment}` : ""}
        </p>

        <p className="mt-0.5 text-[11px] text-gray-500">
          {address.city}, {address.state} {address.zip}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => onEdit?.(address)}
          disabled={disabled}
          className="flex items-center gap-1 text-[11px] font-medium text-gray-600 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pen size={13} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(address)}
          disabled={disabled}
          className="flex items-center gap-1 text-[11px] font-medium text-gray-600 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={13} />
          Delete
        </button>

        {settingDefault ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-900">
            <Spinner className="h-3 w-3" />
            Setting as default...
          </span>
        ) : (
          !address.isDefault && (
            <button
              type="button"
              onClick={() => onSetDefault?.(address)}
              disabled={disabled}
              className="flex items-center gap-1 text-[11px] font-medium text-gray-900 underline underline-offset-4 transition hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Star size={13} />
              Set as Default
            </button>
          )
        )}
      </div>
    </article>
  );
}
