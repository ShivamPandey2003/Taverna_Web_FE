import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminApi, type StaffInput } from "@/services/adminApi";
import {
  INTAKE_ARRIVED,
  INTAKE_JOURNEY,
  journeyReached,
  SERVICE_JOURNEY,
  SERVICE_PAID,
} from "@/types/admin";
import type {
  AdminBooking,
  BookingListParams,
  StaffListParams,
  StaffRole,
  IntakeMethod,
  ValetLeg,
  ValetMilestone,
} from "@/types/admin";
import { staffPage } from "@/components/features/staff/staff.utils";
import type { OfferInput, OfferListParams } from "@/types/offer";
import type { OfferCsvRow } from "@/components/features/offers/offerCsv";

export const adminKeys = {
  bookings: ["admin", "bookings"] as const,
  bookingList: (params: BookingListParams) => ["admin", "bookings", "list", params] as const,
  booking: (id: string) => ["admin", "bookings", "detail", id] as const,
  staff: (role: StaffRole) => ["admin", "staff", role] as const,
  staffList: (role: StaffRole) => ["admin", "staff", role, "list"] as const,
  offers: ["admin", "offers"] as const,
  offerList: (params: OfferListParams) => ["admin", "offers", "list", params] as const,
};

export function useAdminBookings(params: BookingListParams) {
  return useQuery({
    queryKey: adminKeys.bookingList(params),
    queryFn: () => adminApi.listBookings(params),
    // Keep the current page on screen while the next one loads
    placeholderData: keepPreviousData,
  });
}

const JOURNEY_REFRESH_MS = 15_000;

// Someone else is moving the booking on from their own page: the pickup valet
// (from being assigned until they reach the dealership), or the advisor and then
// the paying customer (from the advisor being assigned until the bill is paid)
function othersTurn({ journey }: AdminBooking) {
  if (!journey) return false;
  const between = (from: string, to: string) =>
    journeyReached(journey, from) && !journeyReached(journey, to);
  return between(INTAKE_JOURNEY[0], INTAKE_ARRIVED) || between(SERVICE_JOURNEY[0], SERVICE_PAID);
}

export function useAdminBooking(id: string | null) {
  return useQuery({
    queryKey: adminKeys.booking(id ?? ""),
    queryFn: () => adminApi.getBooking(id!),
    enabled: !!id,
    // While it's someone else's turn the booking is loaded again every so often
    refetchInterval: (query) =>
      query.state.data && othersTurn(query.state.data) ? JOURNEY_REFRESH_MS : false,
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

export const useAssignRelationshipManager = () =>
  useAssignMutation(({ id, managerId }: { id: string; managerId: string }) =>
    adminApi.assignRelationshipManager(id, managerId),
  );

export const useCompleteBooking = () =>
  useBookingMutation((id: string) => adminApi.completeBooking(id));

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
