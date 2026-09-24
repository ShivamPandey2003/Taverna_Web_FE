import { AngleLeft, AngleRight } from "reicon-react";
import { cn } from "@/libs/utils";
import { useAppDispatch } from "@/redux/hooks";
import { setPage, setPageSize } from "@/redux/adminBookings/adminBookingsSlice";

const PAGE_SIZES = [10, 20, 50];

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Up to five page numbers centred on the current page
function visiblePages(page: number, totalPages: number) {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function TablePagination({ page, pageSize, total, totalPages }: TablePaginationProps) {
  const dispatch = useAppDispatch();

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 px-4 py-2">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>
          Showing <span className="font-semibold text-gray-900">{from}–{to}</span> of{" "}
          <span className="font-semibold text-gray-900">{total}</span>
        </span>

        <select
          value={pageSize}
          onChange={(event) => dispatch(setPageSize(Number(event.target.value)))}
          className="h-8 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 outline-none"
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => dispatch(setPage(page - 1))}
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
            onClick={() => dispatch(setPage(number))}
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
          onClick={() => dispatch(setPage(page + 1))}
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
