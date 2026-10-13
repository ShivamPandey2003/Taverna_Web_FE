import Taverna from '@/assets/background.webp'
import type { Dealership } from '@/types/dealership';

export const dealerships: Dealership[] = [
  {
    id: "plantation",
    name: "Taverna CDJR Plantation",
    address: "777 N State Road 7, Plantation, FL 33317",
    image: Taverna,
    valetAvailable: true,
    loanerAvailable: true,
    latitude: 26.1329,
    longitude: -80.203453,
    serviceRadiusMiles: 25,
    timezone: "America/New_York",
    isActive: true,
  },
  {
    id: "fort-lauderdale",
    name: "Taverna Fort Lauderdale",
    address: "909 S Federal Highway, Pompano Beach, FL 33062",
    image: Taverna,
    valetAvailable: true,
    loanerAvailable: true,
    latitude: 26.219538,
    longitude: -80.105646,
    serviceRadiusMiles: 25,
    timezone: "America/New_York",
    isActive: true,
  },
];
