import { Tag } from "reicon-react";
import { TablePagination } from "@/components/features/admin/TablePagination";
import { Modal } from "@/components/ui/Modal";
import { OfferDetails } from "@/components/features/offers/OfferModals";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectSpecialsParams, setSpecialsPage } from "@/redux/specials/specialsSlice";
import {
  closeSpecialOffer,
  openSpecialOffer,
  selectSpecialsModal,
} from "@/redux/modals/specialsModal/specialsModalSlice";
import { useCustomerOffers } from "@/services/queries/offerQueries";
import { SpecialOfferCard } from "./SpecialOfferCard";

// The offers as cards, a page at a time (GET offers)
export function SpecialsList() {
  const dispatch = useAppDispatch();
  const params = useAppSelector(selectSpecialsParams);
  const { data, isPending, isError, isFetching, refetch } = useCustomerOffers(params);
  const filtered = !!params.brandName || !!params.model || params.offerType !== "all";

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-80 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
        <p className="text-sm text-gray-500">We couldn't load the offers.</p>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-3 text-sm font-semibold text-gray-900 underline underline-offset-4 disabled:opacity-50"
        >
          {isFetching ? "Loading..." : "Try Again"}
        </button>
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <Tag size={22} />
        </div>
        <p className="mt-4 text-base font-semibold text-gray-900">
          {filtered ? "No offers match this right now" : "No offers right now"}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {filtered
            ? "Try another vehicle or offer type."
            : "Check back soon for new deals from your dealership."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Thin bar while another page or filter loads over these cards */}
        {isFetching && (
          <div className="absolute inset-x-0 -top-3 h-0.5 animate-pulse rounded bg-black" />
        )}

        {data.items.map((offer) => (
          <SpecialOfferCard
            key={offer.id}
            offer={offer}
            onViewOffer={(selected) => dispatch(openSpecialOffer(selected))}
          />
        ))}
      </div>

      {data.totalPages > 1 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <TablePagination
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            totalPages={data.totalPages}
            onPageChange={(page) => dispatch(setSpecialsPage(page))}
          />
        </div>
      )}

      <SpecialOfferModal />
    </div>
  );
}

// Everything about the offer the customer picked
function SpecialOfferModal() {
  const dispatch = useAppDispatch();
  const { viewing } = useAppSelector(selectSpecialsModal);

  if (!viewing) return null;

  return (
    <Modal
      title={<h2>{viewing.vehicleName}</h2>}
      subtitle={`${viewing.offerType} · Stock ${viewing.stockNumber}`}
      onClose={() => dispatch(closeSpecialOffer())}
    >
      <OfferDetails offer={viewing} />
    </Modal>
  );
}
