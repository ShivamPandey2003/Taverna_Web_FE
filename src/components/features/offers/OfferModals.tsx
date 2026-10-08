import { Modal } from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeOfferDetails,
  closeOfferUpload,
  openDeleteOffer,
  openEditOffer,
  selectOffersModal,
} from "@/redux/modals/offersModal/offersModalSlice";
import { formatCurrency } from "@/components/features/admin/admin.utils";
import type { Offer } from "@/types/offer";
import { OfferUpload } from "./OfferUpload";
import { offerVehicle } from "./offer.utils";

// Bulk upload: pick a CSV, check it, upload it. Closes once the upload goes through.
export function OfferUploadModal() {
  const dispatch = useAppDispatch();
  const { uploadOpen } = useAppSelector(selectOffersModal);
  const onClose = () => dispatch(closeOfferUpload());

  if (!uploadOpen) return null;

  return (
    <Modal
      title={<h2>Bulk Upload Offers</h2>}
      subtitle="Upload the dealership's vehicle offers from a CSV file."
      onClose={onClose}
      width="max-w-[1080px]"
    >
      <OfferUpload onUploaded={onClose} />
    </Modal>
  );
}

// Everything in one offer, including the long text the table leaves out
export function OfferDetailsModal() {
  const dispatch = useAppDispatch();
  const { viewing } = useAppSelector(selectOffersModal);

  if (!viewing) return null;

  return (
    <Modal
      title={<h2>{offerVehicle(viewing)}</h2>}
      subtitle={`VIN ${viewing.vin} · Stock ${viewing.stockNumber}`}
      onClose={() => dispatch(closeOfferDetails())}
      footer={
        <>
          <button
            type="button"
            onClick={() => dispatch(openDeleteOffer(viewing))}
            className="h-10 rounded-lg border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => dispatch(openEditOffer(viewing))}
            className="h-10 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Edit Offer
          </button>
        </>
      }
    >
      <OfferDetails offer={viewing} />
    </Modal>
  );
}

function OfferDetails({ offer }: { offer: Offer }) {
  const rows: { label: string; value: string }[] = [
    { label: "Condition", value: offer.condition },
    { label: "Offer type", value: offer.offerType },
    { label: "Payment", value: `${formatCurrency(offer.payment)} / month` },
    { label: "Payment before tax", value: `${formatCurrency(offer.paymentNoTax)} / month` },
    { label: "Term", value: `${offer.term} months` },
    { label: "APR", value: `${offer.apr}%` },
    { label: "Down payment", value: formatCurrency(offer.downPayment) },
    { label: "Due at signing", value: formatCurrency(offer.dueAtSigning) },
    { label: "Total rebate", value: formatCurrency(offer.totalRebate) },
    { label: "Lender", value: offer.lender },
  ];

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-xs font-medium text-gray-500">{row.label}</dt>
            <dd className="mt-0.5 break-words text-sm font-semibold text-gray-900">
              {row.value || "—"}
            </dd>
          </div>
        ))}
      </dl>

      {offer.description && (
        <div>
          <h3 className="text-xs font-medium text-gray-500">Description</h3>
          <p className="mt-1 text-sm text-gray-900">{offer.description}</p>
        </div>
      )}

      {offer.disclaimer && (
        <div>
          <h3 className="text-xs font-medium text-gray-500">Disclaimer</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{offer.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
