import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  adminApi,
  type DealershipInput,
  type PaymentInput,
  type StaffInput,
} from "@/services/adminApi";
import type { BookingListParams, StaffListParams, StaffRole } from "@/types/admin";
import type { Dealership } from "@/types/dealership";

export const adminKeys = {
  bookings: ["admin", "bookings"] as const,
  bookingList: (params: BookingListParams) => ["admin", "bookings", "list", params] as const,
  booking: (id: string) => ["admin", "bookings", "detail", id] as const,
  staff: (role: StaffRole) => ["admin", "staff", role] as const,
  staffList: (role: StaffRole, params: StaffListParams) =>
    ["admin", "staff", role, "list", params] as const,
  dealerships: ["admin", "dealerships"] as const,
  dealershipList: (search: string) => ["admin", "dealerships", "list", search] as const,
};

// Flip to true once the backend supports ?search= on /admin/dealerships.
// Until then the full list is fetched once and filtered in the browser.
export const DEALERSHIP_SEARCH_VIA_API = false;

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

export function useStaffList(role: StaffRole, params: StaffListParams) {
  return useQuery({
    queryKey: adminKeys.staffList(role, params),
    queryFn: () => adminApi.listStaff(role, params),
    // Keep the current page on screen while the next one loads
    placeholderData: keepPreviousData,
  });
}

// Everyone of a role, for the workflow's assign steps (searched in the browser)
const pickerParams: StaffListParams = {
  page: 1,
  pageSize: 200,
  sortBy: "name",
  sortOrder: "asc",
  search: "",
  availability: "all",
};

export const useStaffOptions = (role: StaffRole) => useStaffList(role, pickerParams);

// Add, edit and delete refresh every list of that role
function useStaffMutation<TVariables, TData>(
  role: StaffRole,
  mutationFn: (variables: TVariables) => Promise<TData>,
  // Editing someone also changes the copy stored on their bookings
  refreshBookings = false,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.staff(role) });
      if (refreshBookings) {
        queryClient.invalidateQueries({ queryKey: adminKeys.bookings });
      }
    },
  });
}

export const useCreateStaff = (role: StaffRole) =>
  useStaffMutation(role, (input: StaffInput) => adminApi.createStaff(role, input));

export const useUpdateStaff = (role: StaffRole) =>
  useStaffMutation(
    role,
    ({ id, input }: { id: string; input: StaffInput }) => adminApi.updateStaff(role, id, input),
    true,
  );

export const useDeleteStaff = (role: StaffRole) =>
  useStaffMutation(role, (id: string) => adminApi.deleteStaff(role, id));

function matchesDealership(dealership: Dealership, search: string) {
  const query = search.trim().toLowerCase();
  return [dealership.name, dealership.address].some((value) =>
    value.toLowerCase().includes(query),
  );
}

export function useDealerships(search: string) {
  const apiSearch = DEALERSHIP_SEARCH_VIA_API ? search : "";

  return useQuery({
    queryKey: adminKeys.dealershipList(apiSearch),
    queryFn: () => adminApi.listDealerships(apiSearch),
    placeholderData: keepPreviousData,
    select: (dealerships) =>
      DEALERSHIP_SEARCH_VIA_API
        ? dealerships
        : dealerships.filter((dealership) => matchesDealership(dealership, search)),
  });
}

export function useCreateDealership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DealershipInput) => adminApi.createDealership(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.dealerships }),
  });
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

export const useCompleteBooking = () =>
  useBookingMutation((id: string) => adminApi.completeBooking(id));

export const useUpdatePayment = () =>
  useBookingMutation(({ id, payment }: { id: string; payment: PaymentInput }) =>
    adminApi.updatePayment(id, payment),
  );
