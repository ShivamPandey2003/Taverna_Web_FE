import Loaner from '@/assets/loaner-only.png'
import pickUp_Delivery from '@/assets/pickup-delivery.png'
import type { Service } from '@/types/service'

export const services: Service[] = [
  {
    id: "pickup-delivery",
    title: "Pickup & Delivery",
    description:
      "We come to you within 30 minutes and leave a free loaner at your door.",
    image: pickUp_Delivery,
    features: [
      "Pickup at your door",
      "Free loaner while we work",
      "Return drop-off included",
    ],
  },

  {
    id: "loaner-only",
    title: "Loaner Only",
    description:
      "Drive to us and swap vehicles — yours is ready when you arrive.",
    image: Loaner,
    features: [
      "Swap vehicles at the shop",
      "Keep the loaner until service is done",
    ],
  },
];
