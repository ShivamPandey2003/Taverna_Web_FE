import DealershipImage from "@/assets/background.webp";
import { request, toQueryString } from "./apiClient";
import type { Dealership } from "@/types/dealership";

// dealerships/list and dealerships/update
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

// What the admin's form saves; the same body for dealerships/save and dealerships/update
export type DealershipInput = Pick<
  Dealership,
  "name" | "address" | "latitude" | "longitude" | "serviceRadiusMiles" | "timezone" | "isActive"
>;

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
    latitude: Number(dealership.latitude),
    longitude: Number(dealership.longitude),
    serviceRadiusMiles: Number(dealership.serviceRadiusMiles),
    timezone: dealership.timezone,
    isActive: dealership.isActive !== false,
  };
}

async function fetchDealerships(near?: Coordinates) {
  const query = near
    ? toQueryString({ latitude: near.latitude, longitude: near.longitude })
    : "";
  const { dealerships } = await request<{ dealerships: DealershipResponse[] }>(
    "get",
    `dealerships/list${query}`,
  );
  return dealerships;
}

export const dealershipApi = {
  // Every active dealership. With the customer's coordinates the API answers
  // for that location, and the result is ordered closest first.
  list: async (near?: Coordinates): Promise<Dealership[]> => {
    const active = (await fetchDealerships(near)).filter(
      (dealership) => dealership.isActive !== false,
    );
    if (near) {
      active.sort((a, b) => distance(near, a) - distance(near, b));
    }
    return active.map(toDealership);
  },

  // Everything the API lists, for the admin page (inactive ones included)
  listAll: async (): Promise<Dealership[]> => (await fetchDealerships()).map(toDealership),

  // `dealerId` is the dealer's own ID, typed by the admin; the API answers with
  // its own id for the dealership, which the list is refetched for
  create: (dealerId: string, input: DealershipInput) =>
    request("post", "dealerships/save", { dealershipId: dealerId, ...input }),

  update: async (id: string, input: DealershipInput): Promise<Dealership> =>
    toDealership(await request<DealershipResponse>("put", `dealerships/update/${id}`, input)),
};
