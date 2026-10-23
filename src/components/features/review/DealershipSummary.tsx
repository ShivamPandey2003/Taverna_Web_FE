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
      {dealership ? (
        // Like the vehicle card: the photo beside the details, sized by the
        // card's own width; on a narrow card (under 360px) it goes above them,
        // across the card's full width, so the name and address get every line
        <div className="@container">
          <div className="flex flex-col gap-3 @[360px]:flex-row @[360px]:items-center @[360px]:gap-4 @[480px]:gap-6">
            {/* Dealership image */}
            <div className="h-32 w-full shrink-0 overflow-hidden rounded-lg @[360px]:h-16 @[360px]:w-24 @[480px]:h-[90px] @[480px]:w-[140px]">
              <img
                src={dealership.image}
                alt={dealership.name}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Information */}
            <div className="min-w-0">
              <h3 className="text-base font-bold leading-snug text-gray-900">
                {dealership.name}
              </h3>

              <p className="mt-1 text-sm text-gray-800">
                {dealership.address}
              </p>
            </div>
          </div>
        </div>
      ) : <p className="text-sm text-gray-500">
        {loading
          ? "Finding your closest dealership..."
          : "No dealership selected. Choose one to continue."}
      </p>}
    </BookingSummaryCard>
  );
}