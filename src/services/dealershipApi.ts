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

// The same in miles (the Earth's radius is 3,958.8 mi), to show next to a dealership
export const distanceMiles = (from: Coordinates, to: Coordinates) =>
  distance(from, to) * 3958.8;

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

// `dealerships/list` needs the Bearer token; `dealerships/public-list` doesn't,
// for the landing page's visitors who aren't logged in. Same params and answer.
async function fetchDealerships(near?: Coordinates, path = "dealerships/list") {
  const query = near
    ? toQueryString({ latitude: near.latitude, longitude: near.longitude })
    : "";
  const { dealerships } = await request<{ dealerships: DealershipResponse[] }>(
    "get",
    `${path}${query}`,
  );
  return dealerships;
}

// Active ones, closest to `near` first when it's given
function activeDealerships(dealerships: DealershipResponse[], near?: Coordinates) {
  const active = dealerships.filter((dealership) => dealership.isActive !== false);
  if (near) {
    active.sort((a, b) => distance(near, a) - distance(near, b));
  }
  return active.map(toDealership);
}

export const dealershipApi = {
  // Every active dealership. With the customer's coordinates the API answers
  // for that location, and the result is ordered closest first.
  list: async (near?: Coordinates): Promise<Dealership[]> =>
    activeDealerships(await fetchDealerships(near), near),

  // The same without logging in (dealerships/public-list): only the landing page
  // ("/") uses it
  listPublic: async (near?: Coordinates): Promise<Dealership[]> =>
    activeDealerships(await fetchDealerships(near, "dealerships/public-list"), near),

  // Everything the API lists, for the admin page (inactive ones included)
  listAll: async (): Promise<Dealership[]> => (await fetchDealerships()).map(toDealership),

  // `dealerId` is the dealer's own ID, typed by the admin; the API answers with
  // its own id for the dealership, which the list is refetched for
  create: (dealerId: string, input: DealershipInput) =>
    request("post", "dealerships/save", { dealershipId: dealerId, ...input }),

  update: async (id: string, input: DealershipInput): Promise<Dealership> =>
    toDealership(await request<DealershipResponse>("put", `dealerships/update/${id}`, input)),

  // Its answer isn't known, so it isn't read: the lists are just fetched again
  delete: (id: string) => request("delete", `dealerships/${id}`),
};
