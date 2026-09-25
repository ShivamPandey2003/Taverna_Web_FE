import { Location } from "reicon-react";
import { cn } from "@/libs/utils";
import type { Dealership } from "@/types/dealership";
import defaultImage from "@/assets/background.webp";

export function DealershipCard({ dealership }: { dealership: Dealership }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Image */}
      <div className="h-[160px] w-full overflow-hidden bg-gray-100">
        <img
          src={dealership.image || defaultImage}
          alt={dealership.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="truncate text-base font-bold text-gray-900">{dealership.name}</h3>

        <p className="mt-1.5 flex items-start gap-1.5 text-sm text-gray-500">
          <Location size={15} className="mt-0.5 shrink-0 text-gray-400" />
          <span>{dealership.address}</span>
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Availability label="Valet" available={dealership.valetAvailable} />
          <Availability label="Loaner" available={dealership.loanerAvailable} />
        </div>
      </div>
    </article>
  );
}

function Availability({ label, available }: { label: string; available: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        available ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500",
      )}
    >
      {label} {available ? "available" : "unavailable"}
    </span>
  );
}
