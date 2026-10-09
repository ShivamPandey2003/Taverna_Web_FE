import { OfferDetailsModal, OfferUploadModal } from "@/components/features/offers/OfferModals";
import { DeleteOfferModal, OfferFormModal } from "@/components/features/offers/OfferFormModal";
import { OffersTable } from "@/components/features/offers/OffersTable";
import { OffersToolbar } from "@/components/features/offers/OffersToolbar";

export function AdminOffers() {
  return (
    // Doesn't scroll: pages show 10 rows, and only the table scrolls on very short screens
    <main className="flex h-full min-h-0 flex-col gap-3 overflow-hidden bg-[#f8f9fa] px-6 py-4 lg:px-10">
      <header className="flex flex-wrap items-baseline gap-x-3">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Offers</h1>
      </header>

      {/* Search and filters, with Bulk Upload next to them */}
      <OffersToolbar />

      <OffersTable />

      <OfferUploadModal />
      <OfferDetailsModal />
      <OfferFormModal />
      <DeleteOfferModal />
    </main>
  );
}
