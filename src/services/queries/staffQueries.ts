import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffToast } from "@/components/features/staffPortal/shared/staffToast";
import { errorMessage } from "@/libs/apiError";
import { staffApi } from "../staffApi";
import type {
  AdvisorMilestone,
  InvoiceLine,
  StaffAuth,
  StaffBooking,
  ValetLeg,
  ValetMilestone,
} from "@/types/admin";

// What a staff page works with: the booking from its route and the sign-in from
// stored staff sign-in (see useStaffAuth)
export interface StaffLinkParams extends StaffAuth {
  id: string;
}

export const staffKeys = {
  bookings: ({ gear, token }: StaffAuth) => ["staff", "bookings", gear, token] as const,
  booking: ({ id, gear, token }: StaffLinkParams) =>
    ["staff", "booking", id, gear, token] as const,
};

// Email + OTP sign-in of the staff pages, for when the link carries no sign-in.
// Failures are toasted here, like the other staff mutations.
export function useStaffSendOtp() {
  return useMutation({
    mutationFn: (email: string) => staffApi.sendOtp(email),
    onError: (error) => staffToast.error(errorMessage(error)),
  });
}

export function useStaffVerifyOtp() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      staffApi.verifyOtp(email, otp),
    onError: (error) => staffToast.error(errorMessage(error)),
  });
}

// The admin can reassign staff or change the booking at any time, so keep the
// page fresh while it's open (and when the staff member comes back to it)
const REFRESH_MS = 15_000;

// The task list: every booking the signed-in staff member is assigned to
export function useStaffBookings(auth: StaffAuth) {
  return useQuery({
    queryKey: staffKeys.bookings(auth),
    queryFn: () => staffApi.listBookings(auth),
    enabled: !!auth.gear && !!auth.token,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function useStaffBooking(link: StaffLinkParams) {
  return useQuery({
    queryKey: staffKeys.booking(link),
    queryFn: () => staffApi.getBooking(link, link.id),
    enabled: !!link.id && !!link.gear && !!link.token,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

// Every update returns the whole booking, so it's stored and the page updates at
// once. A failed one is toasted here (the staff API layer never toasts) and the
// booking refetched: someone else may have moved it on.
function useStaffMutation<TInput extends StaffLinkParams>(
  mutationFn: (input: TInput) => Promise<StaffBooking>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (booking, input) => queryClient.setQueryData(staffKeys.booking(input), booking),
    onError: (error, input) => {
      staffToast.error(errorMessage(error));
      queryClient.invalidateQueries({ queryKey: staffKeys.booking(input) });
    },
  });
}

export function useStaffValetProgress() {
  return useStaffMutation(
    (input: StaffLinkParams & { leg: ValetLeg; milestone: ValetMilestone }) =>
      staffApi.updateValetProgress(input, input.id, input.leg, input.milestone),
  );
}

export function useStaffAdvisorProgress() {
  return useStaffMutation((input: StaffLinkParams & { milestone: AdvisorMilestone }) =>
    staffApi.updateAdvisorProgress(input, input.id, input.milestone),
  );
}

export function useStaffGenerateInvoice() {
  return useStaffMutation((input: StaffLinkParams & { items: InvoiceLine[] }) =>
    staffApi.generateInvoice(input, input.id, input.items),
  );
}

export function useStaffConfirmPayment() {
  return useStaffMutation((input: StaffLinkParams) =>
    staffApi.confirmPayment(input, input.id),
  );
}
