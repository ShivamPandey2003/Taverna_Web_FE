import { Pin } from "reicon-react";
import { BookingSummaryCard } from "./BookingSummaryCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectBooking,
  selectBookingAddress,
} from "@/redux/booking/bookingSlice";
import { openReviewModal } from "@/redux/modals/reviewModal/reviewModalSlice";

export function AddressSummary() {
  const dispatch = useAppDispatch();
  const { pickupLocation } = useAppSelector(selectBooking);
  const address = useAppSelector(selectBookingAddress);

  const renderAddress = () => {
    if (pickupLocation?.type === "current") {
      return (
        <>
          <p className="text-base font-bold text-gray-900">
            Current location
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {pickupLocation.label}
          </p>
        </>
      );
    }

    if (!address) {
      return (
        <p className="text-sm text-gray-500">
          No address selected. Add one to continue.
        </p>
      );
    }

    return (
      <>
        <p className="text-base font-bold text-gray-900">
          {address.address}
        </p>

        <p className="mt-1 text-sm text-gray-500">
          {address.city}, {address.state}{" "}
          {address.zip}
        </p>
      </>
    );
  };

  return (
    <BookingSummaryCard
      title="My Address"
      onChange={() => dispatch(openReviewModal("location"))}
    >
      <div className="flex items-center gap-5">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-50">
          <Pin
            size={21}
            strokeWidth={2}
            className="text-gray-700"
          />
        </div>

        {/* Address */}
        <div>{renderAddress()}</div>
      </div>
    </BookingSummaryCard>
  );
}
