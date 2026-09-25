import { useAppSelector } from "@/redux/hooks";
import { selectDealershipSearch } from "@/redux/adminDealerships/adminDealershipsSlice";
import { useDealerships } from "@/services/queries/adminQueries";
import { DealershipCard } from "./DealershipCard";

export function DealershipGrid() {
  const search = useAppSelector(selectDealershipSearch);
  const { data, isPending, isError, refetch } = useDealerships(search);

  if (isError) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center">
        <p className="text-sm text-gray-500">Couldn't load dealerships.</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (data?.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
        {search.trim() ? "No dealerships match your search." : "No dealerships yet."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {isPending &&
        Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="h-[270px] animate-pulse rounded-2xl bg-gray-100" />
        ))}

      {data?.map((dealership) => (
        <DealershipCard key={dealership.id} dealership={dealership} />
      ))}
    </div>
  );
}
