import { request } from "./apiClient";
import type { Address, AddressInput, AddressType } from "@/types/address";

// A saved address, from every user/addresses call
interface AddressResponse {
  addressId: string;
  label: string | null;
  street: string;
  apartment: string | null;
  city: string;
  state: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  isActive: boolean;
}

const ADDRESS_TYPES: AddressType[] = ["home", "work", "other"];

// The API's free-text label holds our address type; anything else reads as "other"
function toAddressType(label: string | null): AddressType {
  const type = label?.trim().toLowerCase() as AddressType;
  return ADDRESS_TYPES.includes(type) ? type : "other";
}

function toAddress(address: AddressResponse): Address {
  return {
    id: address.addressId,
    type: toAddressType(address.label),
    address: address.street,
    apartment: address.apartment ?? "",
    city: address.city,
    state: address.state,
    zip: address.zipCode,
    latitude: address.latitude,
    longitude: address.longitude,
    isDefault: address.isDefault,
  };
}

// The request names the street lines line1 / line2; responses call them street / apartment
function toPayload(address: AddressInput) {
  return {
    label: address.type,
    line1: address.address,
    line2: address.apartment || null,
    city: address.city,
    state: address.state,
    zipCode: address.zip,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    isDefault: address.isDefault,
  };
}

export const addressApi = {
  // The logged-in customer's saved addresses
  list: async () => {
    const addresses = await request<AddressResponse[] | null>("get", "user/addresses");
    return (addresses ?? []).filter((address) => address.isActive !== false).map(toAddress);
  },

  create: async (address: AddressInput) =>
    toAddress(await request<AddressResponse>("post", "user/addresses", toPayload(address))),

  // Takes the whole address, not only the changed fields
  update: async (id: string, address: AddressInput) =>
    toAddress(
      await request<AddressResponse>(
        "put",
        `user/addresses/${encodeURIComponent(id)}`,
        toPayload(address),
      ),
    ),

  remove: async (id: string) => {
    await request<{ addressId: string }>("delete", `user/addresses/${encodeURIComponent(id)}`);
    return id;
  },
};
