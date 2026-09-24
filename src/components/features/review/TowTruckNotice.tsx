import { AlertCircle, ShieldCheck, X } from "reicon-react";

interface TowTruckNoticeProps {
  price?: number;
  showClose?: boolean;
  onClose?: () => void;
}

export function TowTruckNotice({
  price = 49,
  showClose = true,
  onClose,
}: TowTruckNoticeProps) {
  return (
    <div className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle
            size={16}
            className="text-amber-500"
          />

          <p className="text-sm font-semibold text-gray-900">
            Tow truck service included
          </p>
        </div>

        {showClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Price */}
      <p className="mt-3 text-base font-bold text-gray-900">
        ${price}
      </p>

      {/* ProCare information */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-2.5">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <ShieldCheck size={13} />
        </div>

        <p className="text-[11px] leading-4 text-emerald-800">
          <span className="font-semibold">
            ProCare Plan
          </span>{" "}
          members get{" "}
          <span className="font-semibold">
            FREE towing
          </span>{" "}
          - your plan covers unlimited tows during your
          service cycle.
        </p>
      </div>
    </div>
  );
}