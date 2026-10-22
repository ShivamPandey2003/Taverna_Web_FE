import type { StepProps } from "./BookingSummaryCard";
import {
  BookingSummaryCard,
} from "./BookingSummaryCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBookingVehicle } from "@/redux/booking/bookingSlice";
import { openReviewModal } from "@/redux/modals/reviewModal/reviewModalSlice";
import { VehicleTitle } from "@/components/features/dashboard/VehicleTitle";
import { maskedVin } from "@/libs/utils";
import { MilesField } from "./MilesField";

export function VehicleSummary({ highlight, step }: StepProps) {
  const dispatch = useAppDispatch();
  const vehicle = useAppSelector(selectBookingVehicle);

  return (
    <BookingSummaryCard
      step={step}
      highlight={highlight}
      title="My Vehicle"
      status={{ valid: !!vehicle, label: vehicle ? "Vehicle selected" : "Select a vehicle" }}
      onChange={() => dispatch(openReviewModal("vehicle"))}
    >
      {!vehicle ? (
        <p className="text-sm text-gray-500">
          No vehicle selected.
        </p>
      ) : (
      // The details are three lines everywhere: the name, the VIN, the miles.
      // The photo beside them shrinks with the card's own width, and on a very
      // narrow card (under 260px) it goes above them, across the card's full width.
      <div className="@container">
        <div className="flex flex-col items-stretch gap-3 @[260px]:flex-row @[260px]:items-center @[300px]:gap-4 @[480px]:gap-6">
          {/* Vehicle image */}
          <div className="flex h-32 w-full shrink-0 @[260px]:h-14 @[260px]:w-20 @[300px]:h-16 @[300px]:w-24 @[480px]:h-[90px] @[480px]:w-[140px] items-center justify-center overflow-hidden rounded-lg bg-[#f3f4f7]">
            <img
              src={vehicle.image}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Vehicle details */}
          <div className="w-full min-w-0 @[260px]:w-auto">
            <h3 className="text-base font-bold leading-tight text-gray-900">
              <VehicleTitle vehicle={vehicle} singleLine />
            </h3>

            <div className="mt-1 flex flex-col gap-0.5 text-sm text-gray-800">
              <p className="whitespace-nowrap">
                VIN:{" "}
                <span className="font-semibold text-gray-900" title={vehicle.vin}>
                  {maskedVin(vehicle.vin)}
                </span>
              </p>

              {/* Keyed so an edit in progress doesn't carry over to another vehicle */}
              <MilesField key={vehicle.id} vehicle={vehicle} />
            </div>
          </div>
        </div>
      </div>
      )}
    </BookingSummaryCard>
  );
}