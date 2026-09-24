export interface SpecialOffer {
  id: string;
  title: string;
  description: string;
//   badge: string;
  image?: string;
}

export const specialOffers: SpecialOffer[] = [
  {
    id: "trade-in-bonus",
    title: "Trade-In Bonus — Up to $3,000 Over Book Value",
    description: "Based on your 2022 Jeep Grand Cherokee",
    // badge: "Expires Aug 31",
  },
  {
    id: "apr-offer",
    title: "0% APR for 60 Months on Select Models",
    description: "On 2025-2027 inventory",
    // badge: "Limited time",
  },
  {
    id: "loyalty-bonus",
    title: "$1,000 Loyalty Bonus for Returning Customers",
    description: "Stacks with the trade-in bonus",
    // badge: "While supplies last",
  },
];