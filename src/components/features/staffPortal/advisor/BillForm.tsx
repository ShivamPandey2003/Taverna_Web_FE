import { Add, Trash } from "reicon-react";
import { formatCurrency } from "@/components/features/admin/admin.utils";
import { billTotal, newBillLine, type BillLineDraft } from "./bill";

interface BillFormProps {
  lines: BillLineDraft[];
  onChange: (lines: BillLineDraft[]) => void;
  // Locked while the bill is being sent
  disabled?: boolean;
}

// Up to two decimals, typed as text so the keypad and the value stay predictable
const PRICE_PATTERN = /^\d*\.?\d{0,2}$/;

// The bill before it's generated: one row per charge (item + price), as many
// rows as the advisor needs, laid out like BillCard so it reads as the same bill
export function BillForm({ lines, onChange, disabled = false }: BillFormProps) {
  const total = billTotal(lines);
  const removable = lines.length > 1;

  const update = (id: number, patch: Partial<BillLineDraft>) =>
    onChange(lines.map((line) => (line.id === id ? { ...line, ...patch } : line)));

  return (
    <section className="card">
      <p className="eyebrow">Generate invoice</p>
      <p className="muted mt-0.5">Add each charge with its price.</p>

      <div className="mt-4 flex gap-2">
        <span className="info-label flex-1">Item</span>
        <span className="info-label w-24">Price</span>
        {removable && <span className="w-8 shrink-0" />}
      </div>

      <ul className="mt-1.5 space-y-2">
        {lines.map((line, index) => (
          <li key={line.id} className="flex items-center gap-2">
            <input
              type="text"
              value={line.label}
              onChange={(event) => update(line.id, { label: event.target.value })}
              placeholder="e.g. Oil change"
              aria-label={`Item ${index + 1}`}
              maxLength={60}
              disabled={disabled}
              className="field min-w-0 flex-1"
            />
            <div className="relative w-24 shrink-0">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-secondary">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={line.amount}
                onChange={(event) => {
                  if (PRICE_PATTERN.test(event.target.value)) {
                    update(line.id, { amount: event.target.value });
                  }
                }}
                placeholder="0.00"
                aria-label={`Price of item ${index + 1}`}
                disabled={disabled}
                className="field pl-6 text-right"
              />
            </div>
            {removable && (
              <button
                type="button"
                onClick={() => onChange(lines.filter((item) => item.id !== line.id))}
                disabled={disabled}
                aria-label={`Remove item ${index + 1}`}
                className="flex h-12 w-8 shrink-0 items-center justify-center rounded-button text-text-secondary transition hover:text-danger disabled:opacity-50"
              >
                <Trash size={18} />
              </button>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChange([...lines, newBillLine()])}
        disabled={disabled}
        className="btn btn-secondary btn-sm btn-block mt-3 border-dashed"
      >
        <Add size={18} />
        Add Row
      </button>

      <div className="mt-4 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm font-bold">Total</span>
        <span className="text-xl font-extrabold">{formatCurrency(total)}</span>
      </div>
    </section>
  );
}
