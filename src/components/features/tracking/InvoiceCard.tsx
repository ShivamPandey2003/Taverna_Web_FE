import { CheckCircle } from "reicon-react";
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

// The bill the advisor sent, from the booking's details, with Pay Now, which goes
// straight to Stripe's checkout. Once paid it says so until the dealership
// confirms the payment; the tracking page then drops it. The API layer toasts a
// failed checkout.
export function InvoiceCard({ bookingId, invoice }: InvoiceCardProps) {
  const money = (amount: number) => formatMoney(amount, invoice.currency);
  const payInvoice = usePayInvoice();
  const paid = invoice.paid;
  // Still locked once the checkout is ready, while the browser leaves for it
  const redirecting = payInvoice.isPending || payInvoice.isSuccess;

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
        {paid ? (
          <div className="flex min-h-9 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-2 text-center text-sm">
            <span className="flex items-center gap-2 font-semibold text-status-active">
              <CheckCircle size={17} />
              Paid {money(invoice.total)}
            </span>
            <span className="text-gray-500">· Waiting for the dealership to confirm</span>
          </div>
        ) : (
          <button
            data-test-id="invoice-pay-now"
            type="button"
            onClick={() => payInvoice.mutate(bookingId)}
            disabled={redirecting}
            className="h-9 w-full rounded-lg bg-status-active text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {redirecting ? "Opening Checkout..." : `Pay Now · ${money(invoice.total)}`}
          </button>
        )}
      </div>

    </section>
  );
}
