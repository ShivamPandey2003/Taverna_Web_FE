import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBooking, setDriveable } from "@/redux/booking/bookingSlice";
import { TowTruckNotice } from "./TowTruckNotice";

export function DriveableStatus() {
  const dispatch = useAppDispatch();
  const { driveable: value } = useAppSelector(selectBooking);

  const onChange = (driveable: boolean) => dispatch(setDriveable(driveable));

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white p-5">
      {/* Label */}
      <p className="text-sm font-bold text-gray-900">
        Driveable Status
      </p>

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
          <TowTruckNotice price={49} />
        </div>
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