import { useState } from "react";
import { Calendar } from "reicon-react";
import { BookingSummaryCard } from "./BookingSummaryCard";
import { formatPickupTime } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectBooking, setScheduledAt } from "@/redux/booking/bookingSlice";
import { openReviewModal } from "@/redux/modals/reviewModal/reviewModalSlice";

// The pickup time chosen in the schedule modal; hidden while booking for as soon as possible
export function ScheduleSummary() {
  const dispatch = useAppDispatch();
  const { scheduledAt } = useAppSelector(selectBooking);
  // Checked again when the customer books
  const [now] = useState(() => Date.now());

  if (!scheduledAt) {
    return null;
  }

  const passed = new Date(scheduledAt).getTime() <= now;

  return (
    <BookingSummaryCard
      title="Scheduled Pickup"
      onChange={() => dispatch(openReviewModal("schedule"))}
      onClear={() => dispatch(setScheduledAt(null))}
    >
      <div className="flex items-center gap-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-50">
          <Calendar size={21} strokeWidth={2} className="text-gray-700" />
        </div>

        <div>
          <p className="text-base font-bold text-gray-900">
            {formatPickupTime(scheduledAt)}
          </p>
          <p className={passed ? "mt-1 text-sm text-red-600" : "mt-1 text-sm text-gray-800"}>
            {passed
              ? "This time has passed. Change it or clear it to book now."
              : "Your valet will pick up your vehicle at this time"}
          </p>
        </div>
      </div>
    </BookingSummaryCard>
  );
}
