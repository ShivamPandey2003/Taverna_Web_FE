import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminApi, type PaymentInput } from "@/services/adminApi";
import type { BookingListParams } from "@/types/admin";

export const adminKeys = {
  bookings: ["admin", "bookings"] as const,
  bookingList: (params: BookingListParams) => ["admin", "bookings", "list", params] as const,
  booking: (id: string) => ["admin", "bookings", "detail", id] as const,
  valets: ["admin", "valets"] as const,
  managers: ["admin", "relationship-managers"] as const,
};

export function useAdminBookings(params: BookingListParams) {
  return useQuery({
    queryKey: adminKeys.bookingList(params),
    queryFn: () => adminApi.listBookings(params),
    // Keep the current page on screen while the next one loads
    placeholderData: keepPreviousData,
  });
}

export function useAdminBooking(id: string | null) {
  return useQuery({
    queryKey: adminKeys.booking(id ?? ""),
    queryFn: () => adminApi.getBooking(id!),
    enabled: !!id,
  });
}

export function useValets() {
  return useQuery({ queryKey: adminKeys.valets, queryFn: adminApi.listValets });
}

export function useRelationshipManagers() {
  return useQuery({ queryKey: adminKeys.managers, queryFn: adminApi.listRelationshipManagers });
}

// Every workflow step refreshes both the open booking and the table
function useBookingMutation<TVariables>(
  mutationFn: (variables: TVariables) => ReturnType<typeof adminApi.getBooking>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (booking) => {
      queryClient.setQueryData(adminKeys.booking(booking.id), booking);
      queryClient.invalidateQueries({ queryKey: adminKeys.bookings });
    },
  });
}

export const useConfirmBooking = () =>
  useBookingMutation((id: string) => adminApi.confirmBooking(id));

export const useAssignValet = () =>
  useBookingMutation(({ id, valetId }: { id: string; valetId: string }) =>
    adminApi.assignValet(id, valetId),
  );

export const useAssignRelationshipManager = () =>
  useBookingMutation(({ id, managerId }: { id: string; managerId: string }) =>
    adminApi.assignRelationshipManager(id, managerId),
  );

export const useUpdatePayment = () =>
  useBookingMutation(({ id, payment }: { id: string; payment: PaymentInput }) =>
    adminApi.updatePayment(id, payment),
  );
