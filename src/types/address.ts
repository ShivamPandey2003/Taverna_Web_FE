export type AddressType = "home" | "work" | "other";

export interface Address {
  id: string;
  type: AddressType;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zip: string;
  // Looked up from the street, city, state and ZIP when the address is saved (geocodeApi)
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

// What the API takes to create or update an address
export type AddressInput = Omit<Address, "id">;
