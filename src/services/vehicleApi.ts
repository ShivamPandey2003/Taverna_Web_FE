import { toast } from "sonner";
import PlaceholderImage from "@/assets/jeep-grand-cherokee.webp";
import { request } from "./apiClient";
import type {
  Vehicle,
  VehicleOverview,
  VehicleServiceRecord,
  VerifiedVehicle,
} from "@/types/vehicle";

// POST vehicles/verify-vin
interface VinLookupResponse {
  vin: string;
  verified: boolean;
  // Comes back as text here ("2015") but as a number on saved vehicles
  year: string | number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  color: string;
  image_url: string | null;
}

// A saved vehicle, from vehicles/save and vehicles/list
interface VehicleResponse {
  vehicleId: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  engine: string;
  color: string;
  currentMileage: number | null;
  image_url: string | null;
  isActive: boolean;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

// 45230 -> "45,230 mi". The API stores 0 for a vehicle whose mileage was never given.
export const formatMiles =(mileage: number | null) =>
  mileage ? `${mileage.toLocaleString("en-US")} mi` : null;

function toVehicle(vehicle: VehicleResponse): Vehicle {
  return {
    id: vehicle.vehicleId,
    brand: vehicle.make,
    model: vehicle.model,
    year: Number(vehicle.year),
    vin: vehicle.vin,
    miles: formatMiles(vehicle.currentMileage),
    image: vehicle.image_url || PlaceholderImage,
    trim: vehicle.trim,
    engine: vehicle.engine,
  };
}

// A row of serviceHistory in vehicles/:id/overview. The API has only returned an
// empty list so far, so these field names are a guess: tighten them (and
// toServiceRecord) once a real row is seen.
interface ServiceHistoryResponse {
  id?: string;
  bookingId?: string;
  date?: string;
  serviceDate?: string;
  completedAt?: string;
  createdAt?: string;
  dealership?: string | { name?: string };
  dealershipName?: string;
  mileage?: number | null;
  currentMileage?: number | null;
  amount?: number | string | null;
  total?: number | string | null;
  status?: string;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatAmount(value?: number | string | null) {
  const amount = Number(value);
  return value == null || value === "" || Number.isNaN(amount)
    ? "—"
    : amount.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function toServiceRecord(row: ServiceHistoryResponse, index: number): VehicleServiceRecord {
  const dealership =
    typeof row.dealership === "string" ? row.dealership : row.dealership?.name;

  return {
    id: row.id ?? row.bookingId ?? String(index),
    date: formatDate(row.date ?? row.serviceDate ?? row.completedAt ?? row.createdAt),
    dealership: dealership ?? row.dealershipName ?? "—",
    mileage: formatMiles(row.mileage ?? row.currentMileage ?? null) ?? "—",
    amount: formatAmount(row.amount ?? row.total),
    status: row.status?.toLowerCase().startsWith("cancel") ? "CANCELLED" : "COMPLETED",
  };
}

export const vehicleApi = {
  // Decodes a VIN into vehicle details; nothing is saved yet
  verifyVin: async (vin: string): Promise<VerifiedVehicle> => {
    const result = await request<VinLookupResponse>("post", "vehicles/verify-vin", { vin });

    if (!result.verified) {
      // Not an API error, so the API layer hasn't toasted anything
      const message = "We couldn't verify this VIN. Check it and try again.";
      toast.error(message);
      throw new Error(message);
    }

    return {
      brand: result.make,
      model: result.model,
      year: Number(result.year),
      vin: result.vin,
      miles: null,
      image: result.image_url || PlaceholderImage,
      imageUrl: result.image_url,
      trim: result.trim,
      engine: result.engine,
    };
  },

  // Adds the verified vehicle to the logged-in customer's account
  save: async (vehicle: VerifiedVehicle) =>
    toVehicle(
      await request<VehicleResponse>("post", "vehicles/save", {
        vin: vehicle.vin,
        year: vehicle.year,
        make: vehicle.brand,
        model: vehicle.model,
        trim: vehicle.trim ?? "",
        engine: vehicle.engine ?? "",
        current_mileage: 0,
        image_url: vehicle.imageUrl,
      }),
    ),

  // The logged-in customer's saved vehicles
  list: async () => {
    const { vehicles } = await request<{ vehicles: VehicleResponse[] }>("get", "vehicles/list");
    return vehicles.filter((vehicle) => vehicle.isActive !== false).map(toVehicle);
  },

  // The vehicle's current mileage, as the customer typed it. Answers with the
  // mileage saved, formatted like the list's ("45,230 mi").
  updateMileage: async (vehicleId: string, mileage: number) => {
    const { currentMileage } = await request<{ currentMileage: number }>(
      "post",
      `vehicles/${vehicleId}/mileage`,
      { currentMileage: mileage },
    );
    return formatMiles(Number(currentMileage));
  },

  // One saved vehicle with its past services
  overview: async (vehicleId: string): Promise<VehicleOverview> => {
    const { vehicle, serviceHistory } = await request<{
      vehicle: VehicleResponse;
      serviceHistory: ServiceHistoryResponse[] | null;
    }>("get", `vehicles/${vehicleId}/overview`);

    return {
      vehicle: toVehicle(vehicle),
      serviceHistory: (serviceHistory ?? []).map(toServiceRecord),
    };
  },
};
