import { Plus } from "reicon-react";
import { SearchInput } from "@/components/features/admin/SearchInput";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectDealershipSearch,
  setDealershipSearch,
} from "@/redux/adminDealerships/adminDealershipsSlice";
import { openAddDealership } from "@/redux/modals/dealershipModal/dealershipModalSlice";

export function DealershipsToolbar() {
  const dispatch = useAppDispatch();
  const search = useAppSelector(selectDealershipSearch);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={search}
        onSearch={(value) => dispatch(setDealershipSearch(value))}
        placeholder="Search dealerships by name or address"
      />

      <button
        type="button"
        onClick={() => dispatch(openAddDealership())}
        className="flex h-9 items-center gap-1.5 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        <Plus size={16} strokeWidth={2.5} />
        Add Dealership
      </button>
    </div>
  );
}
