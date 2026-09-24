import pickup from '@/assets/service-photo.png'
import loaner from '@/assets/service-loaner.png'
import exterior from '@/assets/service-Exterior.png'
import interior from '@/assets/service-interior.png'

export const valetServices = [
  {
    title: "Pickup & Delivery",
    description:
      "Our most popular full-concierge option. We come to your location within a 30-minute window, leave a free loaner vehicle at your door, and return your pristine car.",
    image: pickup,
    badge: "Most Popular",
    features: [
      "Pickup at your door",
      "Free loaner while we work",
      "Return drop-off included",
    ],
  },

  {
    title: "Loaner Only",
    description:
      "Prefer to drive your vehicle directly to our studio? Drop off your car and instantly swap keys for a clean, fully fueled loaner vehicle so you don't skip a beat.",
    image:loaner,
    features: [
      "Instant key swap at the shop",
      "Keep loaner until service is completed",
      "Dedicated priority bay",
    ],
  },

  {
    title: "Full Exterior Detail",
    description:
      "A thorough multi-step paint decontamination, premium polish, ceramic sealant coating, and precision wheel detailing that restores showroom gloss.",
    image: exterior,
    badge: "Premium Finish",
    features: [
      "Decontamination wash",
      "Single-stage machine polish",
      "6-month ceramic seal protection",
    ],
  },

  {
    title: "Interior Valet & Sanitization",
    description:
      "Complete deep extraction cleaning of carpets, leather treatment, dash dressing, active odor elimination, and microscopic steam sanitization.",
    image: interior,
    features: [
      "Steam sanitization of touchpoints",
      "Leather conditioning & treatment",
      "Deep fabric hot-water extraction",
    ],
  },
];