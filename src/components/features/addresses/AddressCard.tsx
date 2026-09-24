
import { Building, HomeSmile, Pen, Pin, Star, Trash2 } from 'reicon-react';

import type { Address } from "@/types/address";

interface AddressCardProps {
  address: Address;
  onEdit?: (address: Address) => void;
  onDelete?: (address: Address) => void;
  onSetDefault?: (address: Address) => void;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const getTypeIcon = () => {
    switch (address.type) {
      case "home":
        return HomeSmile;

      case "work":
        return Building;

      default:
        return Pin;
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <article className="rounded-xl border border-gray-200 bg-white px-3 py-3.5">
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
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
            Default
          </span>
        )}
      </div>

      {/* Address */}
      <div className="mt-3">
        <p className="text-xs font-bold text-gray-900">
          {address.address}
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
          className="flex items-center gap-1 text-[11px] font-medium text-gray-600 transition hover:text-gray-900"
        >
          <Pen size={13} />
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete?.(address)}
          className="flex items-center gap-1 text-[11px] font-medium text-gray-600 transition hover:text-red-600"
        >
          <Trash2 size={13} />
          Delete
        </button>

        {!address.isDefault && (
          <button
            type="button"
            onClick={() => onSetDefault?.(address)}
            className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 transition hover:text-emerald-700"
          >
            <Star size={13} />
            Set as Default
          </button>
        )}
      </div>
    </article>
  );
}