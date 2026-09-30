import Image from '@/assets/jeep-grand-cherokee.webp'
import type { Vehicle } from '@/types/vehicle'

// Stand-in for the VIN lookup API: builds vehicle details from a VIN.
// The returned vehicle is not stored anywhere until the user confirms "Add Vehicle".
export function lookupVehicleByVin(vin: string): Omit<Vehicle, "id"> {
  return {
    brand: "JEEP",
    model: "Grand Cherokee",
    year: 2022,
    vin: vin.toUpperCase(),
    miles: "45,230 mi",
    image: Image,
  };
}
