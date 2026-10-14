import { SpecialsFilters } from "@/components/features/specials/SpecialsFilters";
import { SpecialsList } from "@/components/features/specials/SpecialsList";

export function Specials() {
  return (
    <section className="min-h-[calc(100vh-72px)] bg-[#f8f9fa] px-6 py-4 lg:px-10">
      <div className="mx-auto">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Offers Picked for You & Your Vehicle
        </h1>

        <div className="mt-6">
          <SpecialsFilters />
        </div>

        <div className="mt-6">
          <SpecialsList />
        </div>
      </div>
    </section>
  );
}
