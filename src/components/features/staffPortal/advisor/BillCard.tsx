import type { Invoice } from "@/types/admin";
import { formatCurrency } from "@/components/features/admin/admin.utils";
import { formatTime } from "@/libs/utils";
import { StatusChip } from "../shared/StatusChip";

// The generated bill, with the same lines the customer sees
export function BillCard({ invoice, paid }: { invoice: Invoice; paid: boolean }) {
  return (
    <section className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Bill</p>
          <p className="muted mt-0.5">Generated {formatTime(invoice.issuedAt)}</p>
        </div>
        {paid && <StatusChip tone="active">Paid</StatusChip>}
      </div>

      <ul className="mt-4 space-y-2 border-b border-border pb-3 text-sm">
        {/* Advisors type the labels, so two rows can share one */}
        {invoice.items.map((item, index) => (
          <li key={index} className="flex justify-between gap-4">
            <span className="text-text-secondary">{item.label}</span>
            <span className="font-medium">{formatCurrency(item.amount)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-4">
          <span className="text-text-secondary">Tax ({Math.round(invoice.taxRate * 100)}%)</span>
          <span className="font-medium">{formatCurrency(invoice.tax)}</span>
        </li>
      </ul>

      <div className="flex items-baseline justify-between pt-3">
        <span className="text-sm font-bold">Total</span>
        <span className="text-xl font-extrabold">{formatCurrency(invoice.total)}</span>
      </div>
    </section>
  );
}
