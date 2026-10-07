import { OfferUpload } from "@/components/features/offers/OfferUpload";

export function AdminOffers() {
  return (
    <main className="min-h-0 h-full overflow-auto bg-[#f8f9fa] px-6 py-4 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Offers</h1>

          <p className="text-sm text-gray-500">
            Upload the dealership's vehicle offers from a CSV file.
          </p>
        </header>

        <OfferUpload />
      </div>
    </main>
  );
}
