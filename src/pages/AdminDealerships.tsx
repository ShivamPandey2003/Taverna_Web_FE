import { AddDealershipModal } from "@/components/features/dealerships/AddDealershipModal";
import { DealershipGrid } from "@/components/features/dealerships/DealershipGrid";
import { DealershipsToolbar } from "@/components/features/dealerships/DealershipsToolbar";

export function AdminDealerships() {
  return (
    <main className="min-h-0 h-full overflow-auto bg-[#f8f9fa] px-6 py-4 lg:px-10">
      <div className="mx-auto space-y-3">
        {/* Page header */}
        <header className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Dealerships
          </h1>

          <p className="text-sm text-gray-500">
            Locations customers can choose when they book a service.
          </p>
        </header>

        <DealershipsToolbar />

        <DealershipGrid />
      </div>

      <AddDealershipModal />
    </main>
  );
}
