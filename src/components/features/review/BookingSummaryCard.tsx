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

interface BookingSummaryCardProps {
  title: string;
  children: React.ReactNode;
  status?: { valid: boolean; label: string };
  onChange?: () => void;
  // Shows a "Clear" link next to "Change"
  onClear?: () => void;
  className?: string;
}

export function BookingSummaryCard({
  title,
  children,
  status,
  onChange,
  onClear,
  className,
}: BookingSummaryCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          {status && <BookingFieldStatus valid={status.valid} label={status.label} />}
        </div>

        <div className="flex items-center gap-4">
          {onChange && <CardLink label="Change" onClick={onChange} />}
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
