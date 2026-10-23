import { useState } from "react";
import { X } from "reicon-react";
import type { Vehicle } from "@/types/vehicle";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import {
  selectBooking,
  setSelectedVehicle,
} from "@/redux/booking/bookingSlice";
import { VehicleTitle } from "@/components/features/dashboard/VehicleTitle";
import { maskedVin } from "@/libs/utils";

// Visibility is owned by the page's modal slice; the choice is saved to the booking slice
interface SelectVehicleModalProps {
  open: boolean;
  onClose: () => void;
}

export function SelectVehicleModal({
  open,
  onClose,
}: SelectVehicleModalProps) {
  // Mount the content only while open so the highlighted vehicle starts from the saved choice
  if (!open) {
    return null;
  }

  return <SelectVehicleContent onClose={onClose} />;
}

function SelectVehicleContent({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector(selectVehicles);
  const { selectedVehicleId } = useAppSelector(selectBooking);

  const [selectedId, setSelectedId] = useState<string | null>(
    selectedVehicleId
  );

  const selected = vehicles.find(
    (vehicle) => vehicle.id === selectedId
  );

  const handleConfirm = () => {
    if (!selected) {
      return;
    }

    dispatch(setSelectedVehicle(selected.id));
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
      <div className="relative flex min-h-full items-center justify-center overflow-y-auto p-4 sm:p-6">
        {/* Modal */}
        <div
          className="relative w-full max-w-[520px] rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#111827]">
              Select Vehicle
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
          <p className="mt-3 max-w-[430px] text-sm leading-5 text-gray-500 sm:mt-6">
            Choose which vehicle you want to configure,
            request service for, or review maintenance logs.
          </p>

          {/* Vehicle list: as tall as it needs, scrolling past half the screen */}
          <div className="mt-5 max-h-[50dvh] min-h-0 space-y-3 overflow-auto">
            {vehicles.map((vehicle) => (
              <VehicleOption
                key={vehicle.id}
                vehicle={vehicle}
                selected={vehicle.id === selectedId}
                onSelect={() => setSelectedId(vehicle.id)}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="my-4 h-px bg-gray-200 sm:my-5" />

          {/* Actions: sharing the width on phones */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 sm:flex-none sm:px-5"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selected}
              onClick={handleConfirm}
              className="h-10 flex-1 whitespace-nowrap rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-5"
            >
              <span className="sm:hidden">Confirm</span>
              <span className="hidden sm:inline">Confirm Selection</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VehicleOptionProps {
  vehicle: Vehicle;
  selected: boolean;
  onSelect: () => void;
}

function VehicleOption({
  vehicle,
  selected,
  onSelect,
}: VehicleOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left sm:gap-4",
        "transition duration-150",
        selected
          ? "border-2 border-black bg-white"
          : "border-gray-200 bg-white hover:border-gray-400",
      ].join(" ")}
    >
      {/* Image; smaller on phones so the name has room */}
      <div className="flex h-14 w-18 shrink-0 sm:h-[78px] sm:w-[100px] items-center justify-center overflow-hidden rounded-lg bg-gray-50">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-contain"
        />
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold leading-tight text-gray-900 sm:text-base">
          <VehicleTitle vehicle={vehicle} />
        </h3>

        <div className="mt-1 flex items-center gap-4 whitespace-nowrap text-xs text-gray-500 sm:text-sm">
          <span>
            VIN: {maskedVin(vehicle.vin)}
          </span>
        </div>

        <p className="mt-1 whitespace-nowrap text-xs font-medium text-black sm:text-sm">
          Miles: {vehicle.miles || "—"}
        </p>
      </div>

      {/* Radio */}
      <div
        className={[
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
          selected
            ? "border-black"
            : "border-gray-200",
        ].join(" ")}
      >
        {selected && (
          <div className="h-2.5 w-2.5 rounded-full bg-black" />
        )}
      </div>
    </button>
  );
}