import { Check, ShieldCheck } from "reicon-react";
import { cn } from "@/libs/utils";

interface TowTruckNoticeProps {
  price?: number;
  // Ticked by default; the customer can take the tow truck off
  included: boolean;
  onToggle: () => void;
}

// Compact note inside the Driveable card when the car can't be driven. The tow
// truck comes with it unless the customer unticks it (which asks first, see
// DriveableStatus). Choosing "Yes" above removes the note altogether.
export function TowTruckNotice({ price = 49, included, onToggle }: TowTruckNoticeProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        included ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-gray-50",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={included}
          onClick={onToggle}
          className="flex items-center gap-2 text-left text-sm font-semibold text-gray-900"
        >
          <span
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition",
              included ? "border-black bg-black text-white" : "border-gray-400 bg-white",
            )}
          >
            {included && <Check size={11} strokeWidth={4} />}
          </span>
          Tow truck service {included ? "included" : "not included"}
        </button>

        <p className={cn("text-sm font-bold", included ? "text-gray-900" : "text-gray-400 line-through")}>
          ${price}
        </p>
      </div>

      {included ? (
        // Same icon size and gap as the line above so the text lines up
        <p className="mt-1.5 flex items-center gap-2 text-xs text-gray-700">
          <ShieldCheck size={16} className="shrink-0 text-gray-900" />
          <span>
            <span className="font-semibold text-gray-900">ProCare Plan</span> members get{" "}
            <span className="font-semibold text-gray-900">FREE towing</span> - unlimited tows
            during your service cycle.
          </span>
        </p>
      ) : (
        <p className="mt-1.5 pl-6 text-xs text-gray-600">
          You'll get the vehicle to the dealership yourself. Tick the box to add the tow truck
          back.
        </p>
      )}
    </div>
  );
}
