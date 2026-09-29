import { AngleLeft, AngleRight } from "reicon-react";
import { cn } from "@/libs/utils";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Up to five page numbers centred on the current page
function visiblePages(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function TablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
}: TablePaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-4 py-2">
      <span className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900">{from}–{to}</span> of{" "}
        <span className="font-semibold text-gray-900">{total}</span>
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <AngleLeft size={16} />
        </button>

        {visiblePages(page, totalPages).map((number) => (
          <button
            key={number}
            type="button"
            onClick={() => onPageChange(number)}
            className={cn(
              "h-8 min-w-8 rounded-md px-2 text-sm font-medium transition",
              number === page
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100",
            )}
            aria-current={number === page ? "page" : undefined}
          >
            {number}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <AngleRight size={16} />
        </button>
      </div>
    </div>
  );
}
