import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "@/services/bookingApi";
import type { AdminBooking } from "@/types/admin";

export const bookingKeys = {
  open: ["bookings", "open"] as const,
  detail: (id: string | null) => ["bookings", id] as const,
};

// Customer view of one booking; polls so admin progress (confirmation, valet) shows up
export function useMyBooking(id: string | null) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => bookingApi.get(id!),
    enabled: !!id,
    refetchInterval: 15_000,
  });
}

// The customer's unfinished booking, if any. Polls so booking unlocks once the admin
// completes the service.
export function useMyOpenBooking(enabled = true) {
  return useQuery({
    queryKey: bookingKeys.open,
    queryFn: bookingApi.getOpen,
    enabled,
    refetchInterval: 15_000,
  });
}

// Customer booking changes refresh the booking and whether it's still open
function useMyBookingMutation(mutationFn: (id: string) => Promise<AdminBooking>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (booking) => {
      queryClient.setQueryData(bookingKeys.detail(booking.id), booking);
      queryClient.invalidateQueries({ queryKey: bookingKeys.open });
    },
  });
}

export const usePayInvoice = () => useMyBookingMutation((id) => bookingApi.pay(id));

export const useSimulateNextStatus = () =>
  useMyBookingMutation((id) => bookingApi.simulateNextStatus(id));
