import { useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { usePayInvoice } from "@/services/queries/bookingQueries";
import type { CustomerBookingDetails } from "@/types/booking";

interface InvoiceCardProps {
  bookingId: string;
  invoice: NonNullable<CustomerBookingDetails["invoice"]>;
}

const formatMoney = (amount: number, currency: string) => {
  try {
    return amount.toLocaleString("en-US", { style: "currency", currency });
  } catch {
    // An unknown currency code
    return `${amount.toFixed(2)} ${currency}`;
  }
};

// The unpaid bill the advisor sent, from the booking's details, with Pay Now
// (after a confirmation). The tracking page drops it once the bill is paid. The
// API layer toasts a failed payment.
export function InvoiceCard({ bookingId, invoice }: InvoiceCardProps) {
  const money = (amount: number) => formatMoney(amount, invoice.currency);
  const payInvoice = usePayInvoice();
  const [confirming, setConfirming] = useState(false);

  const handlePay = () =>
    payInvoice.mutate(bookingId, {
      onSuccess: () => {
        setConfirming(false);
        toast.success("Payment successful. A valet will bring your vehicle back.");
      },
    });

  return (
    <section className="space-y-2">
      {/* Bill */}
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
        <h2 className="text-base font-bold text-gray-900">Invoice</h2>
        <p className="mt-1 text-[13px] text-gray-500">Booking reference #{bookingId}</p>

        {invoice.generatedAt && (
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 py-3 text-[13px]">
            <span className="text-gray-500">Date</span>
            <span className="font-semibold text-gray-900">{invoice.generatedAt}</span>
          </div>
        )}

        {invoice.items.length > 0 && (
          <ul className="space-y-2 border-t border-gray-200 py-3 text-[13px]">
            {invoice.items.map((item, index) => (
              <li key={`${item.description}-${index}`} className="flex items-center justify-between gap-4">
                <span className="text-gray-900">{item.description}</span>
                <span className="font-semibold text-gray-900">{money(item.amount)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-[13px]">
          <span className="font-bold text-gray-900">Total</span>
          <span className="font-bold text-gray-900">{money(invoice.total)}</span>
        </div>
      </div>

      {/* Payment */}
      <div className="rounded-2xl border border-gray-200 bg-white p-2">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={payInvoice.isPending}
          className="h-9 w-full rounded-lg bg-status-active text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {payInvoice.isPending ? "Processing..." : `Pay Now · ${money(invoice.total)}`}
        </button>
      </div>

      {confirming && (
        <ConfirmModal
          title="Pay Invoice?"
          confirmLabel={`Pay ${money(invoice.total)}`}
          cancelLabel="Not Now"
          pendingLabel="Processing..."
          pending={payInvoice.isPending}
          onConfirm={handlePay}
          onClose={() => setConfirming(false)}
        >
          You'll pay {money(invoice.total)} for booking #{bookingId}. A valet can then bring
          your vehicle back.
        </ConfirmModal>
      )}
    </section>
  );
}
