import type { InvoiceLine } from "@/types/admin";

// A bill row while the advisor is typing it; the price stays text until it's sent
export interface BillLineDraft {
  id: number;
  label: string;
  amount: string;
}

let nextLineId = 0;

export const newBillLine = (): BillLineDraft => ({ id: nextLineId++, label: "", amount: "" });

const roundCents = (value: number) => Math.round(value * 100) / 100;

const isBlank = (line: BillLineDraft) => !line.label.trim() && !line.amount.trim();

// The rows ready to send. Blank rows are skipped; null while a row is half
// filled in or nothing has been entered yet.
export function billItems(lines: BillLineDraft[]): InvoiceLine[] | null {
  const items: InvoiceLine[] = [];
  for (const line of lines) {
    if (isBlank(line)) continue;
    const label = line.label.trim();
    const amount = Number(line.amount);
    if (!label || !(amount > 0)) return null;
    items.push({ label, amount: roundCents(amount) });
  }
  return items.length ? items : null;
}

// Running total as the advisor types: the sum of the prices, which is what's sent
export const billTotal = (lines: BillLineDraft[]) =>
  roundCents(
    lines.reduce((sum, line) => sum + (Number(line.amount) > 0 ? Number(line.amount) : 0), 0),
  );
