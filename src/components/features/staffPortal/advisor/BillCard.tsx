import type { AdvisorServiceDetails } from "@/types/admin";
import { formatCurrency } from "@/components/features/admin/admin.utils";

// The generated bill, with the same lines the customer sees
export function BillCard({ invoice }: { invoice: NonNullable<AdvisorServiceDetails["invoice"]> }) {
  return (
    <section className="card">
      <p className="eyebrow">Bill</p>
      {invoice.generatedAt && <p className="muted mt-0.5">Generated {invoice.generatedAt}</p>}

      {invoice.items.length > 0 && (
        <ul className="mt-4 space-y-2 border-b border-border pb-3 text-sm">
          {/* Advisors type the labels, so two rows can share one */}
          {invoice.items.map((item, index) => (
            <li key={index} className="flex justify-between gap-4">
              <span className="text-text-secondary">{item.label}</span>
              <span className="font-medium">{formatCurrency(item.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-baseline justify-between pt-3">
        <span className="text-sm font-bold">Total</span>
        <span className="text-xl font-extrabold">{formatCurrency(invoice.total)}</span>
      </div>
    </section>
  );
}
