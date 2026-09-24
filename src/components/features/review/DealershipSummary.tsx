import { BookingSummaryCard } from "./BookingSummaryCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBookingDealership } from "@/redux/booking/bookingSlice";
import { openReviewModal } from "@/redux/modals/reviewModal/reviewModalSlice";

export function DealershipSummary() {
  const dispatch = useAppDispatch();
  const dealership = useAppSelector(selectBookingDealership);

  if (!dealership) {
    return null;
  }

  return (
    <BookingSummaryCard
      title="Closest Dealership"
      onChange={() => dispatch(openReviewModal("dealership"))}
    >
      <div className="flex items-center gap-6">
        {/* Dealership image */}
        <div className="h-[90px] w-[140px] shrink-0 overflow-hidden rounded-lg">
          <img
            src={dealership.image}
            alt={dealership.name}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Information */}
        <div>
          <h3 className="text-base font-bold text-gray-900">
            {dealership.name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {dealership.address}
          </p>
        </div>
      </div>
    </BookingSummaryCard>
  );
}