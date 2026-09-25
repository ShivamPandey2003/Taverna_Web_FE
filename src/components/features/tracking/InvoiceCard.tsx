import { CheckCircle } from "reicon-react";
import { toast } from "sonner";
import { usePayInvoice } from "@/services/queries/bookingQueries";
import type { Invoice, PaymentInfo } from "@/types/admin";

interface InvoiceCardProps {
  bookingId: string;
  invoice: Invoice;
  payment: PaymentInfo | null;
}

const formatMoney = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD" });

// "AUG 18, 2026, 3:00 PM"
const formatInvoiceDate = (value: string) =>
  new Date(value)
    .toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
    .toUpperCase();

export function InvoiceCard({ bookingId, invoice, payment }: InvoiceCardProps) {
  const payInvoice = usePayInvoice();
  const paid = payment?.status === "paid";

  const handlePay = () => {
    payInvoice.mutate(bookingId, {
      onSuccess: () => toast.success("Payment successful. Your vehicle is on its way back."),
    });
  };

  return (
    <section className="space-y-2">
      {/* Bill */}
      <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4">
        <h2 className="text-base font-bold text-gray-900">Invoice</h2>
        <p className="mt-1 text-[13px] text-gray-500">Booking reference #{bookingId}</p>

        <div className="mt-4 flex items-center justify-between border-y border-gray-200 py-3 text-[13px]">
          <span className="text-gray-500">Date</span>
          <span className="font-semibold text-gray-900">{formatInvoiceDate(invoice.issuedAt)}</span>
        </div>

        <ul className="space-y-2 border-b border-gray-200 py-3 text-[13px]">
          {invoice.items.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-4">
              <span className="text-gray-900">{item.label}</span>
              <span className="font-semibold text-gray-900">{formatMoney(item.amount)}</span>
            </li>
          ))}
        </ul>

        <dl className="space-y-1.5 pt-3 text-[13px]">
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Subtotal</dt>
            <dd className="font-semibold text-gray-900">{formatMoney(invoice.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Tax ({Math.round(invoice.taxRate * 100)}%)</dt>
            <dd className="font-semibold text-gray-900">{formatMoney(invoice.tax)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-bold text-gray-900">Total</dt>
            <dd className="font-bold text-gray-900">{formatMoney(invoice.total)}</dd>
          </div>
        </dl>
      </div>

      {/* Action */}
      <div className="rounded-2xl border border-gray-200 bg-white p-2">
        {paid ? (
          <div className="flex h-9 items-center justify-center gap-2 text-sm font-semibold text-status-active">
            <CheckCircle size={17} />
            Paid {formatMoney(payment.amount)}
          </div>
        ) : (
          <button
            type="button"
            onClick={handlePay}
            disabled={payInvoice.isPending}
            className="h-9 w-full rounded-lg bg-status-active text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {payInvoice.isPending ? "Processing..." : `Pay Now · ${formatMoney(invoice.total)}`}
          </button>
        )}
      </div>
    </section>
  );
}
