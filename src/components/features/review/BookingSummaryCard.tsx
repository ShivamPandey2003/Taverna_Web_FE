import { cn } from "@/libs/utils";

interface BookingSummaryCardProps {
  title: string;
  children: React.ReactNode;
  onChange?: () => void;
  // Shows a "Clear" link next to "Change"
  onClear?: () => void;
  className?: string;
}

export function BookingSummaryCard({
  title,
  children,
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
        <h2 className="text-sm font-bold text-gray-900">
          {title}
        </h2>

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
