import { CloudUpload } from "reicon-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  resetOfferFilters,
  selectOfferListParams,
  setOfferConditionFilter,
  setOffersSearch,
  setOfferTypeFilter,
} from "@/redux/adminOffers/adminOffersSlice";
import { openOfferUpload } from "@/redux/modals/offersModal/offersModalSlice";
import { OFFER_SEARCH_MAX } from "@/services/adminApi";
import { SearchInput } from "@/components/features/admin/SearchInput";
import { OFFER_CONDITIONS, OFFER_TYPES } from "./offer.utils";

const selectClass =
  "h-9 max-w-[220px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400";

// Search and filters for the offers table, with the bulk upload button next to them
export function OffersToolbar() {
  const dispatch = useAppDispatch();
  const { search, condition, offerType } = useAppSelector(selectOfferListParams);

  const hasFilters = search !== "" || condition !== "all" || offerType !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={search}
        onSearch={(value) => dispatch(setOffersSearch(value))}
        placeholder="Search by VIN, stock number, vehicle or lender"
        maxLength={OFFER_SEARCH_MAX}
      />

      <select
        value={condition}
        onChange={(event) => dispatch(setOfferConditionFilter(event.target.value))}
        className={selectClass}
        aria-label="Filter by condition"
      >
        <option value="all">All Conditions</option>
        {OFFER_CONDITIONS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <select
        value={offerType}
        onChange={(event) => dispatch(setOfferTypeFilter(event.target.value))}
        className={selectClass}
        aria-label="Filter by offer type"
      >
        <option value="all">All Offer Types</option>
        {OFFER_TYPES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => dispatch(resetOfferFilters())}
          className="h-9 rounded-lg px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
        >
          Clear Filters
        </button>
      )}

      <button
        type="button"
        onClick={() => dispatch(openOfferUpload())}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        <CloudUpload size={16} />
        Bulk Upload
      </button>
    </div>
  );
}
