import { SearchInput } from "@/components/features/admin/SearchInput";
import { useAppDispatch } from "@/redux/hooks";
import { setDealershipSearch } from "@/redux/adminDealerships/adminDealershipsSlice";
import { useDealershipSearch } from "./useDealershipSearch";

// Hidden until there are enough dealerships to be worth searching
export function DealershipsToolbar() {
  const dispatch = useAppDispatch();
  const { search, searchEnabled } = useDealershipSearch();

  if (!searchEnabled) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput
        value={search}
        onSearch={(value) => dispatch(setDealershipSearch(value))}
        placeholder="Search dealerships by name or address"
      />
    </div>
  );
}
