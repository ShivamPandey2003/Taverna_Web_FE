export interface Dealership {
  id: string;
  name: string;
  address: string;
  image: string;
  valetAvailable: boolean;
  loanerAvailable: boolean;
  latitude: number;
  longitude: number;
  // How far from the dealership a pickup address can be
  serviceRadiusMiles: number;
  // IANA name, e.g. "America/New_York"
  timezone: string;
  // Inactive dealerships can't be picked for new bookings
  isActive: boolean;
}
