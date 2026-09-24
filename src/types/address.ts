export type AddressType = "home" | "work" | "other";

export interface Address {
  id: string;
  type: AddressType;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zip: string;
  isDefault: boolean;
}
