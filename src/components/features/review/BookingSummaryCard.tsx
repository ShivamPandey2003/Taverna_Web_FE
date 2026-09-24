import { cn } from "@/libs/utils";

interface BookingSummaryCardProps {
  title: string;
  children: React.ReactNode;
  onChange?: () => void;
  className?: string;
}

export function BookingSummaryCard({
  title,
  children,
  onChange,
  className,
}: BookingSummaryCardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">
          {title}
        </h2>

        {onChange && (
          <button
            type="button"
            onClick={onChange}
            className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            Change
          </button>
        )}
      </div>

      <div className="mt-5">
        {children}
      </div>
    </section>
  );
}