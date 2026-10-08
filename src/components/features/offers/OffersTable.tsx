import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectOfferListParams,
  setOffersPage,
  toggleOffersSort,
} from "@/redux/adminOffers/adminOffersSlice";
import {
  openDeleteOffer,
  openEditOffer,
  openOfferDetails,
  openOfferUpload,
} from "@/redux/modals/offersModal/offersModalSlice";
import { useAdminOffers } from "@/services/queries/adminQueries";
import { SortButton } from "@/components/features/admin/SortButton";
import { TablePagination } from "@/components/features/admin/TablePagination";
import { formatCurrency } from "@/components/features/admin/admin.utils";
import type { OfferSortField } from "@/types/offer";
import { cn } from "@/libs/utils";
import { offerVehicle } from "./offer.utils";

const columns: { label: string; sortField?: OfferSortField }[] = [
  { label: "VIN", sortField: "vin" },
  { label: "Stock", sortField: "stockNumber" },
  { label: "Vehicle", sortField: "vehicle" },
  { label: "Condition" },
  { label: "Offer Type", sortField: "offerType" },
  { label: "Payment", sortField: "payment" },
  { label: "Term", sortField: "term" },
  { label: "APR", sortField: "apr" },
  { label: "Lender" },
  { label: "Actions" },
];

// The uploaded offers, a page at a time. Search, filters, sorting and paging all
// happen on the server (see OffersToolbar and the adminOffers slice).
export function OffersTable() {
  const dispatch = useAppDispatch();
  const params = useAppSelector(selectOfferListParams);
  const { data, isPending, isError, isFetching, refetch } = useAdminOffers(params);

  const filtered = params.search !== "" || params.condition !== "all" || params.offerType !== "all";

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {/* Scrolls on its own only if the screen is too short for a full page */}
      <div className="relative min-h-0 overflow-auto">
        {/* Thin bar while a new page / sort / search loads over the current rows */}
        {isFetching && !isPending && (
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 animate-pulse bg-black" />
        )}

        <table className="w-full min-w-[1080px] text-left text-[13px]">
          <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.label}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5",
                    // Sits over the right-aligned Edit / Delete buttons
                    column.label === "Actions" && "text-right",
                  )}
                >
                  {column.sortField ? (
                    <SortButton
                      label={column.label}
                      active={params.sortBy === column.sortField}
                      order={params.sortOrder}
                      onClick={() => dispatch(toggleOffersSort(column.sortField!))}
                    />
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isPending &&
              Array.from({ length: params.pageSize }, (_, index) => (
                <tr key={index}>
                  <td colSpan={columns.length} className="px-4 py-2">
                    <div className="h-5 animate-pulse rounded bg-gray-100" />
                  </td>
                </tr>
              ))}

            {isError && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center">
                  <p className="text-sm text-gray-500">Couldn't load offers.</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="mt-3 text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-black"
                  >
                    Try Again
                  </button>
                </td>
              </tr>
            )}

            {data?.items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center">
                  <p className="text-sm text-gray-500">
                    {filtered
                      ? "No offers match your search or filters."
                      : "No offers yet. Upload the dealership's offers file to add them."}
                  </p>
                  {!filtered && (
                    <button
                      type="button"
                      onClick={() => dispatch(openOfferUpload())}
                      className="mt-3 text-sm font-semibold text-gray-900 underline underline-offset-4 hover:text-black"
                    >
                      Bulk Upload
                    </button>
                  )}
                </td>
              </tr>
            )}

            {data?.items.map((offer) => (
              <tr
                key={offer.id}
                onClick={() => dispatch(openOfferDetails(offer))}
                className="cursor-pointer transition hover:bg-gray-50"
              >
                {/* One line per row; the description and disclaimer are in the details modal */}
                <td className="whitespace-nowrap px-4 py-2 font-mono text-xs font-semibold text-gray-900">
                  {offer.vin}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{offer.stockNumber}</td>
                <td
                  className="max-w-[240px] truncate px-4 py-2 font-medium text-gray-900"
                  title={offerVehicle(offer)}
                >
                  {offerVehicle(offer)}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{offer.condition}</td>
                <td className="max-w-[200px] truncate px-4 py-2 text-gray-700" title={offer.offerType}>
                  {offer.offerType}
                </td>
                <td className="whitespace-nowrap px-4 py-2 font-semibold text-gray-900">
                  {formatCurrency(offer.payment)}
                  <span className="font-normal text-gray-500">/mo</span>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{offer.term} mo</td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{offer.apr}%</td>
                <td className="whitespace-nowrap px-4 py-2 text-gray-700">{offer.lender}</td>

                {/* Clicks here don't also open the details modal */}
                <td className="px-4 py-2" onClick={(event) => event.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => dispatch(openEditOffer(offer))}
                      className="rounded-md border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-900 transition hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch(openDeleteOffer(offer))}
                      className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && (
        <TablePagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
          onPageChange={(page) => dispatch(setOffersPage(page))}
        />
      )}
    </div>
  );
}
