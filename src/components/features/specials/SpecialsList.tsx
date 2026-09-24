import { SpecialOfferCard } from "./SpecialOfferCard";
import { specialOffers } from "./specials.data";

export function SpecialsList() {
  const handleViewOffer = (offer: (typeof specialOffers)[number]) => {
    console.log("Selected offer:", offer);
  };

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {specialOffers.map((offer) => (
        <SpecialOfferCard
          key={offer.id}
          offer={offer}
          onViewOffer={handleViewOffer}
        />
      ))}
    </div>
  );
}