import { ArrowRight, Calendar } from "reicon-react";
import { formatCurrency } from "@/components/features/admin/admin.utils";
import { offerExpiry } from "@/components/features/offers/offer.utils";
import { cn } from "@/libs/utils";
import type { Offer } from "@/types/offer";

interface SpecialOfferCardProps {
  offer: Offer;
  onViewOffer: (offer: Offer) => void;
}

// One offer: the vehicle, the monthly payment and its terms. View Offer opens
// everything, with the description and disclaimer.
export function SpecialOfferCard({ offer, onViewOffer }: SpecialOfferCardProps) {
  const terms = [
    offer.term ? `${offer.term} months` : null,
    `${offer.apr}% APR`,
  ].filter(Boolean);
  const expiry = offerExpiry(offer.expiresAt);

  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 transition-shadow hover:shadow-md">
      {/* Kind of deal */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
          {offer.offerType}
        </span>
        {offer.condition && (
          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
            {offer.condition}
          </span>
        )}
      </div>

      {/* Vehicle */}
      <h2 className="mt-3 text-lg font-bold leading-6 tracking-tight text-gray-900 sm:mt-4">
        {offer.vehicleName}
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        Stock {offer.stockNumber}
        {offer.lender && <> · {offer.lender}</>}
      </p>

      {/* Payment */}
      <div className="mt-4 rounded-xl bg-[#f4f4f6] px-4 py-3 sm:mt-5">
        <p className="text-2xl font-bold tracking-tight text-gray-900">
          {formatCurrency(offer.payment)}
          <span className="text-sm font-medium text-gray-500">/mo</span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500">{terms.join(" · ")}</p>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="whitespace-nowrap text-xs text-gray-500">Due at signing</dt>
          <dd className="font-semibold text-gray-900">{formatCurrency(offer.dueAtSigning)}</dd>
        </div>
        <div>
          <dt className="whitespace-nowrap text-xs text-gray-500">Total rebate</dt>
          <dd className="font-semibold text-gray-900">{formatCurrency(offer.totalRebate)}</dd>
        </div>
      </dl>

      {expiry && (
        <p
          className={cn(
            "mt-4 flex items-center gap-1.5 text-xs font-medium",
            expiry.expired ? "text-red-600" : "text-gray-500",
          )}
        >
          <Calendar size={14} strokeWidth={1.8} />
          {expiry.expired ? "Expired" : "Offer ends"} {expiry.label}
        </p>
      )}

      <div className="mt-auto pt-5 sm:pt-6">
        <button
          data-test-id={`special-view-offer-${offer.id}`}
          type="button"
          onClick={() => onViewOffer(offer)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#111827] text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          View Offer
          <ArrowRight size={18} strokeWidth={2} />
        </button>
      </div>
    </article>
  );
}
