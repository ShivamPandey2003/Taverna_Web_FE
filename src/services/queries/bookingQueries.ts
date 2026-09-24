import { useQuery } from "@tanstack/react-query";
import { bookingApi } from "@/services/bookingApi";

// Customer view of one booking; polls so admin progress (confirmation, valet) shows up
export function useMyBooking(id: string | null) {
  return useQuery({
    queryKey: ["bookings", id],
    queryFn: () => bookingApi.get(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  });
}
