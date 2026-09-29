import { useAppSelector } from "@/redux/hooks";
import { selectDealershipSearch } from "@/redux/adminDealerships/adminDealershipsSlice";
import { useDealerships } from "@/services/queries/adminQueries";

// Search only helps once there are a few dealerships to look through
const SEARCH_MIN_DEALERSHIPS = 6;

// The search to apply, and whether the search box is shown. A search left
// over from before the list got short is ignored, since it can't be cleared.
export function useDealershipSearch() {
  const search = useAppSelector(selectDealershipSearch);
  const { data: all } = useDealerships("");
  const searchEnabled = (all?.length ?? 0) >= SEARCH_MIN_DEALERSHIPS;

  return { search: searchEnabled ? search : "", searchEnabled };
}
