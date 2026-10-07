import DealershipImage from "@/assets/background.webp";
import { request, toQueryString } from "./apiClient";
import type { Dealership } from "@/types/dealership";

// dealerships/list
interface DealershipResponse {
  dealershipId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  serviceRadiusMiles: number;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Straight-line distance; only used to order dealerships, so the unit doesn't matter
function distance(from: Coordinates, to: Coordinates) {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(to.latitude - from.latitude);
  const dLon = rad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(a));
}

function toDealership(dealership: DealershipResponse): Dealership {
  return {
    id: dealership.dealershipId,
    name: dealership.name,
    address: dealership.address,
    // The API has no photo or service flags yet: every dealership gets the same
    // photo and is shown as offering valet and loaners, as the static list did
    image: DealershipImage,
    valetAvailable: true,
    loanerAvailable: true,
  };
}

export const dealershipApi = {
  // Every active dealership. With the customer's coordinates the API answers
  // for that location, and the result is ordered closest first.
  list: async (near?: Coordinates): Promise<Dealership[]> => {
    const query = near
      ? toQueryString({ latitude: near.latitude, longitude: near.longitude })
      : "";
    const { dealerships } = await request<{ dealerships: DealershipResponse[] }>(
      "get",
      `dealerships/list${query}`,
    );

    const active = dealerships.filter((dealership) => dealership.isActive !== false);
    if (near) {
      active.sort((a, b) => distance(near, a) - distance(near, b));
    }
    return active.map(toDealership);
  },
};
