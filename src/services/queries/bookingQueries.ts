import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingApi, staffNeeded } from "@/services/bookingApi";
import type { BookingSummary, StaffNeed } from "@/types/booking";

export const bookingKeys = {
  list: ["bookings", "list"] as const,
  status: (id: string | null) => ["bookings", "status", id] as const,
  details: (id: string | null) => ["bookings", "details", id] as const,
  staff: (id: string | null, need: StaffNeed | null, code: string | undefined) =>
    ["bookings", "staff", id, need, code] as const,
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

// The valet or advisor the tracking page shows (the real API's staff-details).
// Called only while the status (`code`) needs someone (staffNeeded): never before
// the status is known, nor at a stage with nobody to show. Not polled: asked
// again when the status moves on, in case the dealership swapped the person;
// the last answer stays on screen meanwhile.
export function useBookingStaff(id: string | null, code: string | undefined) {
  const need = code ? staffNeeded(code) : null;

  return useQuery({
    queryKey: bookingKeys.staff(id, need, code),
    queryFn: () => bookingApi.getStaff(id!, need!),
    enabled: !!id && !!need,
    placeholderData: (previous, previousQuery) =>
      // Keep showing the same person only while it's the same role and leg
      JSON.stringify(previousQuery?.queryKey[3]) === JSON.stringify(need) ? previous : undefined,
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

// Pays the bill; the admin then confirms it, which moves the status on (polled)
export function usePayInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bookingApi.pay(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.status(id) });
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
      queryClient.removeQueries({ queryKey: ["bookings", "staff", id] });
    },
  });
}
