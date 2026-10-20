import type { StepProps } from "./BookingSummaryCard";
import { BookingSummaryCard } from "./BookingSummaryCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBookingDealership } from "@/redux/booking/bookingSlice";
import { openReviewModal } from "@/redux/modals/reviewModal/reviewModalSlice";

// `loading` is true while the review page is still finding the closest dealership
export function DealershipSummary({
  loading = false,
  highlight,
  step,
}: StepProps & { loading?: boolean }) {
  const dispatch = useAppDispatch();
  const dealership = useAppSelector(selectBookingDealership);

  return (
    <BookingSummaryCard
      step={step}
      highlight={highlight}
      title="Destination Dealership"
      status={{
        valid: !!dealership,
        label: dealership ? "Dealership selected" : "Select a dealership",
      }}
      onChange={() => dispatch(openReviewModal("dealership"))}
    >
      {dealership ? <div className="flex items-center gap-6">
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

          <p className="mt-1 text-sm text-gray-800">
            {dealership.address}
          </p>
        </div>
      </div> : <p className="text-sm text-gray-500">
        {loading
          ? "Finding your closest dealership..."
          : "No dealership selected. Choose one to continue."}
      </p>}
    </BookingSummaryCard>
  );
}