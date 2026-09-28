import { toast } from "sonner";
import type { AdminBooking } from "@/types/admin";
import { BookingStatus } from "@/types/booking";
import {
  useCompleteBooking,
  useConfirmPayment,
  useGenerateInvoice,
} from "@/services/queries/adminQueries";
import { formatCurrency, formatDateTime } from "../admin.utils";
import { StepDone } from "./ConfirmStep";

interface StepProps {
  booking: AdminBooking;
  onDone: () => void;
}

// The admin never enters payment details: the bill comes from the server and
// the admin only confirms that the customer paid it
export function PaymentStep({ booking, onDone }: StepProps) {
  const generateInvoice = useGenerateInvoice();
  const confirmPayment = useConfirmPayment();
  const { invoice, payment } = booking;

  if (payment?.status === "paid") {
    return (
      <StepDone
        text={`${formatCurrency(payment.amount)} paid on ${formatDateTime(payment.updatedAt)}`}
        actionLabel="Next: complete service"
        onAction={onDone}
      />
    );
  }

  if (!invoice) {
    const handleGenerate = () => {
      generateInvoice.mutate(booking.id, {
        onSuccess: () => toast.success(`Bill sent to ${booking.customer.name}`),
      });
    };

    return (
      <div className="rounded-xl border border-gray-200 p-5">
        <h3 className="text-base font-bold text-gray-900">Generate the bill</h3>
        <p className="mt-1 text-sm text-gray-500">
          Once the service work is done, send the customer their bill so they can pay it.
        </p>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={generateInvoice.isPending}
          className="mt-5 h-11 w-full rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generateInvoice.isPending ? "Generating..." : "Generate Bill"}
        </button>
      </div>
    );
  }

  const handleConfirm = () => {
    confirmPayment.mutate(booking.id, {
      onSuccess: () => {
        toast.success(`Payment confirmed for ${booking.id}`);
        onDone();
      },
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Confirm payment</h3>
          <p className="mt-1 text-sm text-gray-500">
            Confirm once the customer has paid the full amount due.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-gray-500">Amount due</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Bill issued {formatDateTime(invoice.issuedAt)}
      </p>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={confirmPayment.isPending}
        className="mt-5 h-11 w-full rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {confirmPayment.isPending ? "Confirming..." : "Confirm Payment Received"}
      </button>
    </div>
  );
}

// Last step; only unlocked once the payment is confirmed. Completing the
// service lets the customer book again.
export function CompleteStep({ booking }: { booking: AdminBooking }) {
  const completeBooking = useCompleteBooking();

  if (booking.status === BookingStatus.SERVICE_COMPLETE) {
    return <StepDone text="Service complete. The customer can book again." />;
  }

  const handleComplete = () => {
    completeBooking.mutate(booking.id, {
      onSuccess: () => toast.success(`Booking ${booking.id} marked complete`),
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-bold text-gray-900">Complete the service</h3>
      <p className="mt-1 text-sm text-gray-500">
        The customer can't book another service until this one is complete.
      </p>

      <button
        type="button"
        onClick={handleComplete}
        disabled={completeBooking.isPending}
        className="mt-5 h-11 w-full rounded-lg bg-status-active text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {completeBooking.isPending ? "Completing..." : "Mark Service Complete"}
      </button>
    </div>
  );
}
