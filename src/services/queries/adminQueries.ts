import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminApi, type DealershipInput, type StaffInput } from "@/services/adminApi";
import type {
  AdvisorMilestone,
  BookingListParams,
  StaffListParams,
  StaffRole,
  IntakeMethod,
  ValetLeg,
  ValetMilestone,
} from "@/types/admin";
import { staffPage } from "@/components/features/staff/staff.utils";
import type { Dealership } from "@/types/dealership";
import type { OfferInput, OfferListParams } from "@/types/offer";
import type { OfferCsvRow } from "@/components/features/offers/offerCsv";

export const adminKeys = {
  bookings: ["admin", "bookings"] as const,
  bookingList: (params: BookingListParams) => ["admin", "bookings", "list", params] as const,
  booking: (id: string) => ["admin", "bookings", "detail", id] as const,
  staff: (role: StaffRole) => ["admin", "staff", role] as const,
  staffList: (role: StaffRole) => ["admin", "staff", role, "list"] as const,
  dealerships: ["admin", "dealerships"] as const,
  dealershipList: (search: string) => ["admin", "dealerships", "list", search] as const,
  offers: ["admin", "offers"] as const,
  offerList: (params: OfferListParams) => ["admin", "offers", "list", params] as const,
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

// Everyone of the role is fetched once; the page asked for is cut out in the browser
export function useStaffList(role: StaffRole, params: StaffListParams) {
  return useQuery({
    queryKey: adminKeys.staffList(role),
    queryFn: () => adminApi.listStaff(role),
    select: (staff) => staffPage(staff, params),
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

// Add, edit and delete refresh every dealership list
function useDealershipMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.dealerships });
      // Renaming a dealership also renames it on its bookings
      queryClient.invalidateQueries({ queryKey: adminKeys.bookings });
    },
  });
}

export const useCreateDealership = () =>
  useDealershipMutation((input: DealershipInput) => adminApi.createDealership(input));

export const useUpdateDealership = () =>
  useDealershipMutation(({ id, input }: { id: string; input: DealershipInput }) =>
    adminApi.updateDealership(id, input),
  );

export const useDeleteDealership = () =>
  useDealershipMutation((id: string) => adminApi.deleteDealership(id));

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

export const useSetLegMethod = () =>
  useBookingMutation(
    ({ id, leg, method }: { id: string; leg: ValetLeg; method: IntakeMethod }) =>
      adminApi.setLegMethod(id, leg, method),
  );

export const useConfirmLegDone = () =>
  useBookingMutation(({ id, leg }: { id: string; leg: ValetLeg }) =>
    adminApi.confirmLegDone(id, leg),
  );

// Assigning answers with a status summary, not the booking: the booking's details
// (and the table) are loaded again, and who is assigned is shown from there. The
// mutation stays pending until they have arrived.
function useAssignMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.bookings }),
  });
}

export const useAssignValet = () =>
  useAssignMutation(({ id, leg, valetId }: { id: string; leg: ValetLeg; valetId: string }) =>
    adminApi.assignValet(id, leg, valetId),
  );

export const useUpdateValetProgress = () =>
  useBookingMutation(
    ({ id, leg, milestone }: { id: string; leg: ValetLeg; milestone: ValetMilestone }) =>
      adminApi.updateValetProgress(id, leg, milestone),
  );

export const useUpdateAdvisorProgress = () =>
  useBookingMutation(({ id, milestone }: { id: string; milestone: AdvisorMilestone }) =>
    adminApi.updateAdvisorProgress(id, milestone),
  );

export const useAssignRelationshipManager = () =>
  useAssignMutation(({ id, managerId }: { id: string; managerId: string }) =>
    adminApi.assignRelationshipManager(id, managerId),
  );

export const useCompleteBooking = () =>
  useBookingMutation((id: string) => adminApi.completeBooking(id));

export const useGenerateInvoice = () =>
  useBookingMutation((id: string) => adminApi.generateInvoice(id));

export const useConfirmPayment = () =>
  useBookingMutation((id: string) => adminApi.confirmPayment(id));

export function useAdminOffers(params: OfferListParams) {
  return useQuery({
    queryKey: adminKeys.offerList(params),
    queryFn: () => adminApi.listOffers(params),
    // Keep the current page on screen while the next one loads
    placeholderData: keepPreviousData,
  });
}

// Editing or deleting an offer refreshes every page of the list
export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: OfferInput }) =>
      adminApi.updateOffer(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.offers }),
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteOffer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.offers }),
  });
}

// A new file replaces the offers, so every page of the list is refetched
export function useUploadOffers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, rows }: { file: File; rows: OfferCsvRow[] }) =>
      adminApi.uploadOffers(file, rows),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.offers }),
  });
}
