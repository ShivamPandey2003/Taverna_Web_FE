import { useState } from "react";
import { X } from "reicon-react";
import type { Vehicle } from "@/types/vehicle";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import {
  selectBooking,
  setSelectedVehicle,
} from "@/redux/booking/bookingSlice";

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
      <div className="relative flex min-h-full items-center justify-center overflow-y-auto p-6">
        {/* Modal */}
        <div
          className="relative w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl"
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
          <p className="mt-6 max-w-[430px] text-sm leading-5 text-gray-500">
            Choose which vehicle you want to configure,
            request service for, or review maintenance logs.
          </p>

          {/* Vehicle list */}
          <div className="mt-5 space-y-3 min-h-0 h-[50vh] overflow-auto">
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
          <div className="my-5 h-px bg-gray-200" />

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
              disabled={!selected}
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
        "flex w-full items-center gap-4 rounded-xl border p-3 text-left",
        "transition duration-150",
        selected
          ? "border-2 border-black bg-white"
          : "border-gray-200 bg-white hover:border-gray-300",
      ].join(" ")}
    >
      {/* Image */}
      <div className="flex h-[78px] w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
        <img
          src={vehicle.image}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-contain"
        />
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-bold text-gray-900">
          {vehicle.brand} {vehicle.model}
        </h3>

        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
          <span>
            Year: {vehicle.year}
          </span>

          <span>
            VIN: **{vehicle.vin.slice(-4)}
          </span>
        </div>

        <p className="mt-1 text-sm font-medium text-emerald-500">
          Miles: {vehicle.miles}
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