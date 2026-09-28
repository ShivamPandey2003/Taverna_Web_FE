import { Plus } from "reicon-react";
import { DealershipFormModal } from "@/components/features/dealerships/DealershipFormModal";
import { DealershipGrid } from "@/components/features/dealerships/DealershipGrid";
import { DealershipsToolbar } from "@/components/features/dealerships/DealershipsToolbar";
import { DeleteDealershipModal } from "@/components/features/dealerships/DeleteDealershipModal";
import { useAppDispatch } from "@/redux/hooks";
import { openAddDealership } from "@/redux/modals/dealershipModal/dealershipModalSlice";

export function AdminDealerships() {
  const dispatch = useAppDispatch();

  return (
    <main className="min-h-0 h-full overflow-auto bg-[#f8f9fa] px-6 py-4 lg:px-10">
      <div className="mx-auto space-y-3">
        {/* Page header, with the add button on the right */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Dealerships
            </h1>

            <p className="text-sm text-gray-500">
              Locations customers can choose when they book a service.
            </p>
          </div>

          <button
            type="button"
            onClick={() => dispatch(openAddDealership())}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            <Plus size={16} strokeWidth={2.5} />
            Add Dealership
          </button>
        </header>

        <DealershipsToolbar />

        <DealershipGrid />
      </div>

      <DealershipFormModal />
      <DeleteDealershipModal />
    </main>
  );
}
