import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// VIN lookups return brands in capitals: "JEEP" -> "Jeep"
export function brandName(brand: string) {
  return brand.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Only the end of a VIN fits on cards: "1C4RJF...4567" -> "***4567"
export function maskedVin(vin: string) {
  return `***${vin.slice(-4)}`;
}

// "Michael Rivera" -> "Michael R."
export function shortName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest.at(-1);
  return last ? `${first} ${last.charAt(0)}.` : first;
}
