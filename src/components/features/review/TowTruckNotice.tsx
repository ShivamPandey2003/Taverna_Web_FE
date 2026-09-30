import { AlertCircle, ShieldCheck } from "reicon-react";

interface TowTruckNoticeProps {
  price?: number;
}

// Compact note inside the Driveable card when the car can't be driven.
// Choosing "Yes" above removes it, so it has no close button.
export function TowTruckNotice({ price = 49 }: TowTruckNoticeProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <AlertCircle size={16} className="shrink-0 text-amber-500" />
          Tow truck service included
        </p>

        <p className="text-sm font-bold text-gray-900">${price}</p>
      </div>

      {/* Same icon size and gap as the line above so the text lines up */}
      <p className="mt-1.5 flex items-center gap-2 text-xs text-gray-700">
        <ShieldCheck size={16} className="shrink-0 text-gray-900" />
        <span>
          <span className="font-semibold text-gray-900">ProCare Plan</span> members get{" "}
          <span className="font-semibold text-gray-900">FREE towing</span> - unlimited tows
          during your service cycle.
        </span>
      </p>
    </div>
  );
}
