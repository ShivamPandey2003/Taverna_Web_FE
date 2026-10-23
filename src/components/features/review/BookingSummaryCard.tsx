import { AlertCircle, CheckCircle } from "reicon-react";
import { cn } from "@/libs/utils";

export function BookingFieldStatus({
  valid,
  label,
}: {
  valid: boolean;
  label: string;
}) {
  return valid ? (
    <CheckCircle
      size={17}
      className="shrink-0 text-green-600"
      aria-label={label}
      role="img"
    />
  ) : (
    <AlertCircle
      size={17}
      className="shrink-0 text-amber-500"
      aria-label={label}
      role="img"
    />
  );
}

// The card's number on the review page, in the order the customer reads and
// fills them. Goes inside the title's own text, so both sit on one baseline.
export function StepNumber({ step }: { step: number }) {
  return (
    <span className="mr-2 lining-nums" aria-hidden="true">
      {step}
    </span>
  );
}

// "Required" beside the title of the first card still missing something
export function NextStepTag() {
  return (
    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
      Required
    </span>
  );
}

// The ring around the card the customer should fill next
export const highlightClass = "border-amber-400 ring-4 ring-amber-100";

// What a review card takes to be highlighted as the next one to fill
export interface StepProps {
  highlight?: boolean;
  // Its number on the page
  step?: number;
}

interface BookingSummaryCardProps {
  title: string;
  // Its number on the page, before the title
  step?: number;
  // The first card in the order that still needs filling
  highlight?: boolean;
  children: React.ReactNode;
  status?: { valid: boolean; label: string };
  onChange?: () => void;
  // The link's text; by default "Select" while the card is empty (its status
  // isn't valid) and "Change" once it's filled
  changeLabel?: string;
  // Shows a "Clear" link next to "Change"
  onClear?: () => void;
  className?: string;
}

export function BookingSummaryCard({
  title,
  step,
  highlight = false,
  children,
  status,
  onChange,
  changeLabel = status && !status.valid ? "Select" : "Change",
  onClear,
  className,
}: BookingSummaryCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-4 transition sm:p-5",
        highlight && highlightClass,
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">
            {step !== undefined && <StepNumber step={step} />}
            {title}
          </h2>
          {status && <BookingFieldStatus valid={status.valid} label={status.label} />}
          {highlight && <NextStepTag />}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          {onChange && <CardLink label={changeLabel} onClick={onChange} />}
          {onClear && <CardLink label="Clear" onClick={onClear} />}
        </div>
      </div>

      <div className="mt-4">
        {children}
      </div>
    </section>
  );
}
function CardLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold text-gray-900 underline underline-offset-4 transition hover:text-black"
    >
      {label}
    </button>
  );
}
