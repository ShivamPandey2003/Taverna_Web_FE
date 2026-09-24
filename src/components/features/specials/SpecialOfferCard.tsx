import { Car, ArrowRight  } from 'reicon-react';

import type { SpecialOffer } from "./specials.data";

interface SpecialOfferCardProps {
  offer: SpecialOffer;
  onViewOffer?: (offer: SpecialOffer) => void;
}

export function SpecialOfferCard({
  offer,
  onViewOffer,
}: SpecialOfferCardProps) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg bg-[#f4f4f6]">
        {offer.image ? (
          <img
            src={offer.image}
            alt={offer.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <Car
            size={36}
            strokeWidth={1.5}
            className="text-slate-400"
          />
        )}
      </div>

      {/* Content */}
      <div className="mt-6">
        <h2 className="text-lg font-bold leading-6 tracking-tight text-gray-900">
          {offer.title}
        </h2>

        <p className="mt-2 text-sm leading-5 text-gray-500">
          {offer.description}
        </p>
      </div>

      {/* Bottom section */}
      <div className="mt-auto pt-8">
        {/* Badge */}
        {/* <span className="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
          {offer.badge}
        </span> */}

        {/* Button */}
        <button
          type="button"
          onClick={() => onViewOffer?.(offer)}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#111827] text-sm font-semibold text-white transition-colors hover:bg-black"
        >
          View Offer

          <ArrowRight
            size={18}
            strokeWidth={2}
          />
        </button>
      </div>
    </article>
  );
}