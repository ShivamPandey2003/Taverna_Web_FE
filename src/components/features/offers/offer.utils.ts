import type { Offer } from "@/types/offer";

// "2026 Ram 1500 Big Horn"
export const offerVehicle = (offer: Offer) =>
  [offer.year, offer.brand, offer.model, offer.trim].filter(Boolean).join(" ");
