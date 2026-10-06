import { cn } from "@/libs/utils";
import { selectAccountUser } from "@/redux/account/accountSlice";
import { useAppSelector } from "@/redux/hooks";
import type { Booking } from "@/types/booking";
import { getBookingDetailGroups, type Detail } from "./bookingDetails";

// What the customer booked: the booking, the vehicle as it was booked and who
// booked it. Fills the tracking page before anyone is assigned.
export function BookingDetailsCard({ booking }: { booking: Booking }) {
  const user = useAppSelector(selectAccountUser);
  const concern = booking.concern.trim();
  const [bookingGroup, ...others] = getBookingDetailGroups(booking, user);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-bold text-gray-900">Booking Details</h2>

      {/* The booking itself, four across */}
      <DetailGrid details={bookingGroup.details} className="mt-3 lg:grid-cols-4" />

      {/* Vehicle and customer side by side */}
      <div className="mt-3 grid gap-x-8 gap-y-3 border-t border-gray-100 pt-3 lg:grid-cols-2">
        {others.map((group) => (
          <div key={group.title} className="min-w-0">
            <h3 className="text-xs font-semibold tracking-wide text-gray-400">{group.title}</h3>
            <DetailGrid details={group.details} className="mt-1.5 sm:grid-cols-3" />
          </div>
        ))}
      </div>

      {concern && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <h3 className="text-xs font-semibold tracking-wide text-gray-400">Your Concern</h3>
          <p className="mt-1.5 text-sm text-gray-900">{concern}</p>
        </div>
      )}
    </section>
  );
}

function DetailGrid({ details, className }: { details: Detail[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-8 gap-y-3 sm:grid-cols-2", className)}>
      {details.map((detail) => (
        <div key={detail.label} className={cn("min-w-0", detail.wide && "sm:col-span-2")}>
          <dt className="text-xs font-medium text-gray-500">{detail.label}</dt>
          <dd className="mt-0.5 wrap-break-word text-sm font-semibold text-gray-900">
            {detail.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
