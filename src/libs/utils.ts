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

// A vehicle's name on one line: "2022 Jeep Grand Cherokee"
export function vehicleName(vehicle: { year: number; brand: string; model: string }) {
  return `${vehicle.year} ${brandName(vehicle.brand)} ${vehicle.model}`;
}

// A pickup or booking time for customers: "Thu, Oct 2 • 10:30 AM"
export function formatPickupTime(value: string | Date) {
  const date = new Date(value);
  const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} • ${time}`;
}
