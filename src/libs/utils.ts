import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// VIN lookups return brands in capitals: "JEEP" -> "Jeep"
export function brandName(brand: string) {
  return brand.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Only the end of a VIN fits on cards: "1C4RJF...234567" -> "***234567" (or the
// last `visible` characters)
export function maskedVin(vin: string, visible = 6) {
  return `***${vin.slice(-visible)}`;
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

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0].charAt(0) + (parts.length > 1 ? parts.at(-1)!.charAt(0) : "")).toUpperCase();
}

// "3:42 PM" today, "Sep 28, 3:42 PM" on other days
export function formatTime(value: string) {
  const date = new Date(value);
  const today = date.toDateString() === new Date().toDateString();
  return date.toLocaleString("en-US", {
    ...(!today && { month: "short", day: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
}

// Link for dialing from the phone: "(954) 555-0141" -> "tel:9545550141"
export function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

// Opens turn-by-turn directions in Google Maps (or the phone's maps app)
export function directionsLink(destination: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
