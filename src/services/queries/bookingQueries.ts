import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi } from "@/services/bookingApi";
import type { AdminBooking } from "@/types/admin";
import type { BookingSummary } from "@/types/booking";

export const bookingKeys = {
  list: ["bookings", "list"] as const,
  status: (id: string | null) => ["bookings", "status", id] as const,
  details: (id: string | null) => ["bookings", "details", id] as const,
};

const STATUS_REFRESH_MS = 15_000;

// Where one booking stands (the real API's status-summary), for the tracking
// page: polled, so the dealership's progress shows up. The API layer toasts a
// failure, so it isn't retried.
export function useServiceStatus(id: string | null) {
  return useQuery({
    queryKey: bookingKeys.status(id),
    queryFn: () => bookingApi.getStatus(id!),
    enabled: !!id,
    refetchInterval: STATUS_REFRESH_MS,
    retry: false,
  });
}

// What was booked (the real API's customer details), for the tracking page. Not
// polled: loaded again only when the polled status (`code`) moves past the one
// the details were loaded at, since that's when they can change (the bill).
export function useCustomerBookingDetails(id: string | null, code: string | undefined) {
  const query = useQuery({
    queryKey: bookingKeys.details(id),
    queryFn: () => bookingApi.getDetails(id!),
    enabled: !!id,
    retry: false,
  });
  const { data, refetch, isFetching } = query;
  const stale = !!code && !!data && data.code !== code;

  useEffect(() => {
    if (stale && !isFetching) refetch();
    // Only when the status moves on, not each time a fetch ends
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stale, code]);

  return query;
}

const LIST_REFRESH_MS = 30_000;

// All of the customer's bookings with their status (the real API's booking/list):
// what the status bubbles and the vehicle cards follow, and what puts the tracked
// bookings back after a reload. Polled, so a service that moves on or finishes
// shows without a reload.
export function useMyBookings(enabled = true) {
  return useQuery({
    queryKey: bookingKeys.list,
    queryFn: bookingApi.list,
    enabled,
    refetchInterval: LIST_REFRESH_MS,
    retry: false,
  });
}

// Customer booking changes refresh the booking and whether it's still open
function useMyBookingMutation(mutationFn: (id: string) => Promise<AdminBooking>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.status(booking.id) });
      queryClient.invalidateQueries({ queryKey: bookingKeys.details(booking.id) });
      queryClient.invalidateQueries({ queryKey: bookingKeys.list });
    },
  });
}

// Cancelling removes the booking, so its cached copies go too. Anything still
// polling is stopped first so a late answer can't bring the booking back.
export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookingApi.cancel(id),
    onSuccess: async (_, id) => {
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      queryClient.setQueryData<BookingSummary[]>(bookingKeys.list, (bookings) =>
        bookings?.filter((booking) => booking.id !== id),
      );
      queryClient.removeQueries({ queryKey: bookingKeys.status(id) });
      queryClient.removeQueries({ queryKey: bookingKeys.details(id) });
    },
  });
}

export const usePayInvoice =() => useMyBookingMutation((id) => bookingApi.pay(id));
