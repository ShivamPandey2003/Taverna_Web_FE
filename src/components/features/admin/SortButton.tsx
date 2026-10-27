import { SortAsc, SortDesc, SortV } from "reicon-react";
import { cn } from "@/libs/utils";

// Column header that sorts by its column; shows the direction when active
export function SortButton({
  label,
  active,
  order,
  onClick,
  testId = `sort-${label.toLowerCase().replace(/\s+/g, "-")}`,
}: {
  label: string;
  active: boolean;
  order: "asc" | "desc";
  onClick: () => void;
  testId?: string;
}) {
  const Icon = !active ? SortV : order === "asc" ? SortAsc : SortDesc;

  return (
    <button
      type="button"
      onClick={onClick}
      data-test-id={testId}
      className={cn(
        "flex items-center gap-1.5 uppercase tracking-wide transition hover:text-gray-900",
        active && "text-gray-900",
      )}
    >
      {label}
      <Icon size={14} className={active ? "text-gray-900" : "text-gray-300"} />
    </button>
  );
}
