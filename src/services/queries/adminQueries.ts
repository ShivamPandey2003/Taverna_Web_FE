import {
  keepPreviousData,
  useIsFetching,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { liveRefetch, refetchEvery } from "@/libs/polling";
import { useAppSelector } from "@/redux/hooks";
import { selectBookingsRefresh } from "@/redux/adminRefresh/adminRefreshSlice";
import { adminApi, type OfferUploadStep, type StaffInput } from "@/services/adminApi";
import type {
  BookingListParams,
  StaffListParams,
  StaffRole,
  IntakeMethod,
  ValetLeg,
} from "@/types/admin";
import { staffPage } from "@/components/features/staff/staff.utils";
import type { OfferInput, OfferListParams } from "@/types/offer";

export const adminKeys = {
  bookings: ["admin", "bookings"] as const,
  bookingList: (params: BookingListParams) => ["admin", "bookings", "list", params] as const,
  booking: (id: string) => ["admin", "bookings", "detail", id] as const,
  // Under bookings, so the refresh button and every booking update reload it too
  history: (id: string) => ["admin", "bookings", "history", id] as const,
  staff: (role: StaffRole) => ["admin", "staff", role] as const,
  staffList: (role: StaffRole) => ["admin", "staff", role, "list"] as const,
  offers: ["admin", "offers"] as const,
  offerList: (params: OfferListParams) => ["admin", "offers", "list", params] as const,
};

export function useAdminBookings(params: BookingListParams) {
  // The page header's auto refresh: every 5 / 10 / 15 / 20s, or stopped
  const seconds = useAppSelector(selectBookingsRefresh);

  return useQuery({
    queryKey: adminKeys.bookingList(params),
    queryFn: () => adminApi.listBookings(params),
    // Keep the current page on screen while the next one loads
    placeholderData: keepPreviousData,
    refetchInterval: refetchEvery(seconds ? seconds * 1000 : false),
  });
}

// The toolbar's refresh button: the list and the booking open in the drawer.
// `refreshing` is true while any of them is loading, the 5s poll included.
export function useRefreshAdminBookings() {
  const queryClient = useQueryClient();
  const refreshing = useIsFetching({ queryKey: adminKeys.bookings }) > 0;

  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.bookings });

  return { refresh, refreshing };
}

export function useAdminBooking(id: string | null) {
  return useQuery({
    queryKey: adminKeys.booking(id ?? ""),
    queryFn: () => adminApi.getBooking(id!),
    enabled: !!id,
    // Loads again every 5s while open, so what valets, advisors and customers do
    // shows in the drawer
    refetchInterval: liveRefetch,
  });
}

// Only while the history modal is open; polled like the drawer, so a step the
// valet or advisor posts shows up in it
export function useBookingHistory(id: string | null) {
  return useQuery({
    queryKey: adminKeys.history(id ?? ""),
    queryFn: () => adminApi.getHistory(id!),
    enabled: !!id,
    refetchInterval: liveRefetch,
  });
}

// The search and availability filter are the server's (a new search or filter
// loads the list again, the current rows staying up meanwhile); the sorting and
// the page asked for are cut out in the browser
export function useStaffList(role: StaffRole, params: StaffListParams) {
  const filters = { search: params.search.trim(), availability: params.availability };

  return useQuery({
    queryKey: [...adminKeys.staffList(role), filters],
    queryFn: () => adminApi.listStaff(role, filters),
    select: (staff) => staffPage(staff, params),
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

// Changing how the vehicle comes in is answered the same way
export const useSetLegMethod = () =>
  useAssignMutation(({ id, leg, method }: { id: string; leg: ValetLeg; method: IntakeMethod }) =>
    adminApi.setLegMethod(id, leg, method),
  );

export const useAssignValet = () =>
  useAssignMutation(({ id, leg, valetId }: { id: string; leg: ValetLeg; valetId: string }) =>
    adminApi.assignValet(id, leg, valetId),
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

// A new file replaces the offers, so every page of the list is refetched.
// `step` is where the three-part upload has got to (prepare, S3, import), for
// the button; null when nothing is running.
export function useUploadOffers() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<OfferUploadStep | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadOffers(file, setStep),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.offers }),
    onSettled: () => setStep(null),
  });

  return { ...mutation, step };
}
