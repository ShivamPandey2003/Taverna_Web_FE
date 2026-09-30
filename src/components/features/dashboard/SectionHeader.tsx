interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
}

export function SectionHeader({
  icon,
  title,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-700">
        {icon}
      </div>

      <h3 className="text-sm font-bold text-gray-900">
        {title}
      </h3>
    </div>
  );
}

export function inputClass(hasError: boolean) {
  return [
    "h-11 w-full rounded-xl border bg-white",
    "pl-11 pr-4 text-sm text-gray-900",
    "outline-none transition",
    "placeholder:text-gray-400",
    "focus:ring-2",
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-gray-200 focus:border-gray-400 focus:ring-gray-100",
  ].join(" ");
}