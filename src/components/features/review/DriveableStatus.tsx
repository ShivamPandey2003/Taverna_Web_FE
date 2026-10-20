import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBooking, setDriveable, setTowTruck } from "@/redux/booking/bookingSlice";
import {
  closeReviewModal,
  openReviewModal,
  selectReviewModal,
} from "@/redux/modals/reviewModal/reviewModalSlice";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TowTruckNotice } from "./TowTruckNotice";
import { BookingFieldStatus, StepNumber } from "./BookingSummaryCard";

export function DriveableStatus({ step }: { step?: number }) {
  const dispatch = useAppDispatch();
  const { driveable: value, towTruck } = useAppSelector(selectBooking);
  const confirmingRemoval = useAppSelector(selectReviewModal) === "removeTow";

  const onChange = (driveable: boolean) => dispatch(setDriveable(driveable));

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5">
      {/* Label */}
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-gray-900">
          {step !== undefined && <StepNumber step={step} />}
          Driveable Status
        </p>
        <BookingFieldStatus
          valid={typeof value === "boolean"}
          label={typeof value === "boolean" ? "Driveability confirmed" : "Choose driveability"}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        {/* Question */}
        <p className="text-sm text-gray-900">
          Car driveable
        </p>

        {/* Options */}
        <div className="flex items-center gap-4">
          <RadioOption
            label="Yes"
            selected={value === true}
            onClick={() => onChange(true)}
          />

          <RadioOption
            label="No"
            selected={value === false}
            onClick={() => onChange(false)}
          />
        </div>
      </div>

      {/* A car that can't be driven is towed in */}
      {value === false && (
        <div className="mt-3">
          <TowTruckNotice
            price={49}
            included={towTruck}
            // Taking it off asks first; putting it back doesn't. Either way the
            // car stays "not driveable".
            onToggle={() =>
              towTruck ? dispatch(openReviewModal("removeTow")) : dispatch(setTowTruck(true))
            }
          />
        </div>
      )}

      {confirmingRemoval && (
        <ConfirmModal
          title="Remove Tow Truck?"
          confirmLabel="Remove Tow Truck"
          cancelLabel="Keep Tow Truck"
          onConfirm={() => {
            dispatch(setTowTruck(false));
            dispatch(closeReviewModal());
          }}
          onClose={() => dispatch(closeReviewModal())}
        >
          Your vehicle is marked as not driveable. Without the tow truck you'll need to get it
          to the dealership yourself. You can add the tow truck back before you book.
        </ConfirmModal>
      )}
    </div>
  );
}

interface RadioOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function RadioOption({
  label,
  selected,
  onClick,
}: RadioOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 text-sm text-gray-900"
    >
      <span
        className={[
          "flex h-4 w-4 items-center justify-center rounded-full border-2",
          selected
            ? "border-black"
            : "border-gray-300",
        ].join(" ")}
      >
        {selected && (
          <span className="h-2 w-2 rounded-full bg-black" />
        )}
      </span>

      {label}
    </button>
  );
}