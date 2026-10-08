import Image from '@/assets/jeep-grand-cherokee.webp'
import type { Vehicle } from '@/types/vehicle'

// What the stand-in lookup can answer with
const models: Pick<Vehicle, "brand" | "model">[] = [
  { brand: "JEEP", model: "Grand Cherokee" },
  { brand: "JEEP", model: "Wrangler" },
  { brand: "DODGE", model: "Durango" },
  { brand: "RAM", model: "1500" },
  { brand: "CHRYSLER", model: "Pacifica" },
  { brand: "JEEP", model: "Compass" },
  { brand: "DODGE", model: "Charger" },
  { brand: "RAM", model: "2500" },
];

// A VIN's 10th character is its model year
const modelYears: Record<string, number> = {
  L: 2020,
  M: 2021,
  N: 2022,
  P: 2023,
  R: 2024,
  S: 2025,
  T: 2026,
};

// The same VIN always gives the same number
function vinNumber(vin: string) {
  return [...vin].reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 1_000_003, 7);
}

// Stand-in for the VIN lookup API: builds vehicle details from a VIN. Each VIN
// gets its own model, year and mileage (always the same ones for that VIN); the
// photo is the one stock picture for every model.
// The returned vehicle is not stored anywhere until the user confirms "Add Vehicle".
export function lookupVehicleByVin(vin: string): Omit<Vehicle, "id"> {
  const code = vin.toUpperCase();
  const number = vinNumber(code);
  const miles = 5_000 + (number % 90) * 1_000 + (number % 997);

  return {
    ...models[number % models.length],
    year: modelYears[code.charAt(9)] ?? 2019 + (number % 7),
    vin: code,
    miles: `${miles.toLocaleString("en-US")} mi`,
    image: Image,
  };
}
