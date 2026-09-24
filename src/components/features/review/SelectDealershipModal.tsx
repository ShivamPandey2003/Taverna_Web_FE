import { useState } from "react";
import { X, Car, Discover } from "reicon-react";
import type { Dealership } from "@/types/dealership";
import { dealerships } from "./dealership.data";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectBooking,
  setSelectedDealership,
} from "@/redux/booking/bookingSlice";

interface SelectDealershipModalProps {
  open: boolean;
  onClose: () => void;
}

export function SelectDealershipModal({
  open,
  onClose,
}: SelectDealershipModalProps) {
  if (!open) {
    return null;
  }

  return <SelectDealershipContent onClose={onClose} />;
}

function SelectDealershipContent({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const { selectedDealershipId } = useAppSelector(selectBooking);

  const [selectedId, setSelectedId] = useState<string | null>(
    selectedDealershipId
  );

  const selectedDealershipData = dealerships.find(
    (dealership) => dealership.id === selectedId
  );

  const handleConfirm = () => {
    if (!selectedDealershipData) {
      return;
    }

    dispatch(setSelectedDealership(selectedDealershipData.id));
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal wrapper */}
      <div className="relative flex min-h-full items-center justify-center overflow-y-auto p-6">
        {/* Modal */}
        <div
          className="relative w-full max-w-[540px] rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#111827]">
              Select Dealership
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          {/* Description */}
          <p className="mt-6 max-w-[470px] text-sm leading-5 text-gray-500">
            Choose a preferred location to view available service
            windows, loaner options, and custom valet coverage.
          </p>

          {/* Dealerships */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            {dealerships.map((dealership) => (
              <DealershipCard
                key={dealership.id}
                dealership={dealership}
                selected={dealership.id === selectedId}
                onSelect={() => setSelectedId(dealership.id)}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-gray-200" />

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedDealershipData}
              onClick={handleConfirm}
              className="h-10 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DealershipCardProps {
  dealership: Dealership;
  selected: boolean;
  onSelect: () => void;
}

function DealershipCard({
  dealership,
  selected,
  onSelect,
}: DealershipCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "overflow-hidden rounded-2xl border text-left transition",
        selected
          ? "border-2 border-emerald-500"
          : "border-gray-200 hover:border-gray-300",
      ].join(" ")}
    >
      {/* Image */}
      <div className="h-[120px] w-full overflow-hidden bg-gray-100">
        <img
          src={dealership.image}
          alt={dealership.name}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-bold text-gray-900">
          {dealership.name}
        </h3>

        <p className="mt-1 min-h-[36px] text-xs leading-4 text-gray-500">
          {dealership.address}
        </p>

        {/* Features */}
        <div className="mt-3 flex flex-col items-start gap-1.5">
          {dealership.valetAvailable && (
            <FeatureBadge>
              <Car size={12} />
              Valet Available
            </FeatureBadge>
          )}

          {dealership.loanerAvailable && (
            <FeatureBadge>
              <Discover size={8} fill="currentColor" />
              Loaner Available
            </FeatureBadge>
          )}
        </div>
      </div>
    </button>
  );
}

function FeatureBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
      {children}
    </span>
  );
}