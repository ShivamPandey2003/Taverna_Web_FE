import defaultVehicleImage from "@/assets/jeep-grand-cherokee.webp";

// Stock photos per brand, in public/, for vehicles the API has no photo of
const BRAND_IMAGES: Record<string, string> = {
  chrysler: "/Chrysler.png",
  dodge: "/Dodge.png",
  fiat: "/Fiat.png",
  jeep: "/Jeep.png",
  ram: "/RAM.png",
};

// The stock photo for a brand ("RAM") or a vehicle's name ("2026 Ram 1500"):
// the first word that's a brand we have a photo of, else the general one
export function brandImage(text: string) {
  const brand = text
    .toLowerCase()
    .split(/\s+/)
    .find((word) => word in BRAND_IMAGES);
  return brand ? BRAND_IMAGES[brand] : defaultVehicleImage;
}
