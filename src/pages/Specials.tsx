import { SpecialsList } from "@/components/features/specials/SpecialsList";

export function Specials() {
  return (
    <section className="min-h-[calc(100vh-72px)] bg-[#f8f9fa] px-6 py-4 lg:px-10">

      {/* Header */}
      <div className="mx-auto">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Offers picked for you & your vehicle
        </h1>

        {/* Offers */}
        <div className="mt-8">
          <SpecialsList />
        </div>
      </div>

    </section>
  );
}