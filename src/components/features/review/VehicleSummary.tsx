import {
  BookingSummaryCard,
} from "./BookingSummaryCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBookingVehicle } from "@/redux/booking/bookingSlice";
import { openReviewModal } from "@/redux/modals/reviewModal/reviewModalSlice";
import { VehicleTitle } from "@/components/features/dashboard/VehicleTitle";
import { maskedVin } from "@/libs/utils";

export function VehicleSummary() {
  const dispatch = useAppDispatch();
  const vehicle = useAppSelector(selectBookingVehicle);

  return (
    <BookingSummaryCard
      title="My Vehicle"
      onChange={() => dispatch(openReviewModal("vehicle"))}
    >
      {!vehicle ? (
        <p className="text-sm text-gray-500">
          No vehicle selected.
        </p>
      ) : (
      <div className="flex items-center gap-6">
        {/* Vehicle image */}
        <div className="flex h-[90px] w-[140px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f3f4f7]">
          <img
            src={vehicle.image}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-contain"
          />
        </div>

        {/* Vehicle details */}
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-tight text-gray-900">
            <VehicleTitle vehicle={vehicle} />
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-7 gap-y-1 text-sm text-gray-800">
            <p>
              VIN:{" "}
              <span className="font-semibold text-gray-900" title={vehicle.vin}>
                {maskedVin(vehicle.vin)}
              </span>
            </p>

            <p>
              Miles:{" "}
              <span className="font-semibold text-gray-900">
                {vehicle.miles}
              </span>
            </p>
          </div>
        </div>
      </div>
      )}
    </BookingSummaryCard>
  );
}