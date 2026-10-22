import { useState } from "react";
import { Calendar } from "reicon-react";
import { BookingSummaryCard } from "./BookingSummaryCard";
import { formatPickupTime } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBooking, selectBookingService, setScheduledAt } from "@/redux/booking/bookingSlice";
import { openReviewModal } from "@/redux/modals/reviewModal/reviewModalSlice";

// The pickup time (Loaner Only: the drop-off time) chosen in the schedule modal;
// hidden while booking for as soon as possible
export function ScheduleSummary({ step }: { step?: number }) {
  const dispatch = useAppDispatch();
  const { scheduledAt } = useAppSelector(selectBooking);
  const loanerOnly = useAppSelector(selectBookingService).id === "loaner-only";
  // Checked again when the customer books
  const [now] = useState(() => Date.now());

  if (!scheduledAt) {
    return null;
  }

  const passed = new Date(scheduledAt).getTime() <= now;

  return (
    <BookingSummaryCard
      step={step}
      // Optional, so no check or warning sign; a passed time is flagged in red below
      title={loanerOnly ? "Scheduled Drop In" : "Scheduled Pickup"}
      onChange={() => dispatch(openReviewModal("schedule"))}
      onClear={() => dispatch(setScheduledAt(null))}
    >
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="flex h-10 w-10 shrink-0 items-center sm:h-12 sm:w-12 justify-center rounded-full bg-gray-50">
          <Calendar size={21} strokeWidth={2} className="text-gray-700" />
        </div>

        <div>
          <p className="text-base font-bold text-gray-900">
            {formatPickupTime(scheduledAt)}
          </p>
          <p className={passed ? "mt-1 text-sm text-red-600" : "mt-1 text-sm text-gray-800"}>
            {passed
              ? "This time has passed. Change it or clear it to book now."
              : loanerOnly
                ? "Bring your vehicle to the dealership at this time"
                : "Your valet will pick up your vehicle at this time"}
          </p>
        </div>
      </div>
    </BookingSummaryCard>
  );
}
