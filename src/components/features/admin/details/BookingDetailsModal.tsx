import { Modal } from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeBookingDetails,
  openBookingWorkflow,
  selectAdminModal,
} from "@/redux/modals/adminModal/adminModalSlice";
import { useAdminBooking } from "@/services/queries/adminQueries";
import type { AdminBooking, StaffMember } from "@/types/admin";
import { BookingStatusBadge } from "../BookingStatusBadge";
import { formatCurrency, formatDateTime } from "../admin.utils";
import { BookingOverview } from "./BookingOverview";

// Read-only view of a booking; the workflow steps live in BookingWorkflowDrawer
export function BookingDetailsModal() {
  const dispatch = useAppDispatch();
  const { detailsBookingId } = useAppSelector(selectAdminModal);
  const { data: booking, isPending, isError } = useAdminBooking(detailsBookingId);

  if (!detailsBookingId) {
    return null;
  }

  const onClose = () => dispatch(closeBookingDetails());

  return (
    <Modal
      title={
        <>
          <h2>Booking {detailsBookingId}</h2>
          {booking && <BookingStatusBadge status={booking.status} />}
        </>
      }
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Close
          </button>

          <button
            type="button"
            disabled={!booking}
            onClick={() => dispatch(openBookingWorkflow(detailsBookingId))}
            className="h-10 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Manage Booking
          </button>
        </>
      }
    >
      {isPending && (
        <div className="space-y-3">
          <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-24 animate-pulse rounded-xl bg-gray-100" />
        </div>
      )}

      {isError && (
        <p className="py-10 text-center text-sm text-gray-500">Couldn't load this booking.</p>
      )}

      {booking && (
        <div className="space-y-5">
          <BookingOverview booking={booking} />
          <BookingHandling booking={booking} />
        </div>
      )}
    </Modal>
  );
}

const staffLine = (member: StaffMember | null) =>
  member ? `${member.name} · ${member.phone}` : "Not assigned";

// Who is handling the booking and where payment stands
function BookingHandling({ booking }: { booking: AdminBooking }) {
  const rows: { label: string; value: string }[] = [
    {
      label: "Confirmed",
      value: booking.confirmedAt ? formatDateTime(booking.confirmedAt) : "Not confirmed yet",
    },
    { label: "Pickup valet", value: staffLine(booking.valet) },
    { label: "Advisor", value: staffLine(booking.relationshipManager) },
    { label: "Delivery valet", value: staffLine(booking.deliveryValet ?? null) },
    {
      label: "Payment",
      value: booking.payment
        ? `${formatCurrency(booking.payment.amount)} · ${booking.payment.status}`
        : booking.invoice
          ? `${formatCurrency(booking.invoice.total)} · awaiting payment`
          : "No bill yet",
    },
  ];

  return (
    <section>
      <h3 className="mb-2 text-sm font-bold text-gray-900">Handling</h3>

      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-xs text-gray-500">{row.label}</dt>
            <dd className="mt-0.5 break-words text-sm font-semibold text-gray-900">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
