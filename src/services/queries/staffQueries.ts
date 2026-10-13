import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { staffToast } from "@/components/features/staffPortal/shared/staffToast";
import { staffTasks } from "@/components/features/staffPortal/shared/tasks";
import { errorMessage } from "@/libs/apiError";
import { staffApi } from "../staffApi";
import type {
  AdvisorMilestone,
  InvoiceLine,
  StaffAuth,
  StaffBooking,
  StaffType,
} from "@/types/admin";

// What a staff page works with: the booking from its route and the sign-in from
// stored staff sign-in (see useStaffAuth)
export interface StaffLinkParams extends StaffAuth {
  id: string;
}

export const staffKeys = {
  tasks: (type: StaffType, { gear, token }: StaffAuth) =>
    ["staff", "tasks", type, gear, token] as const,
  valetTrip: ({ id, gear, token }: StaffLinkParams) =>
    ["staff", "valetTrip", id, gear, token] as const,
  booking: ({ id, gear, token }: StaffLinkParams) =>
    ["staff", "booking", id, gear, token] as const,
};

// Email + OTP sign-in of the staff pages, for when the link carries no sign-in.
// Failures are toasted here, like the other staff mutations.
export function useStaffSendOtp() {
  return useMutation({
    mutationFn: ({ email, type }: { email: string; type: StaffType }) =>
      staffApi.sendOtp(email, type),
    onError: (error) => staffToast.error(errorMessage(error)),
  });
}

export function useStaffVerifyOtp() {
  return useMutation({
    mutationFn: ({ email, otp, type }: { email: string; otp: string; type: StaffType }) =>
      staffApi.verifyOtp(email, otp, type),
    onError: (error) => staffToast.error(errorMessage(error)),
  });
}

// The admin can reassign staff or change the booking at any time, so keep the
// page fresh while it's open (and when the staff member comes back to it)
const REFRESH_MS = 15_000;

// The task list of the signed-in valet (the real API) or advisor (still the
// mock's bookings, a task made from each)
export function useStaffTasks(type: StaffType, auth: StaffAuth) {
  return useQuery({
    queryKey: staffKeys.tasks(type, auth),
    queryFn: async () =>
      type === "valet"
        ? staffApi.listValetTasks(auth)
        : staffTasks(await staffApi.listBookings(auth)),
    enabled: !!auth.gear && !!auth.token,
    // Loaded once: no polling, and no reload on coming back to the tab
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// A trip of the signed-in valet (the real API)
export function useValetTrip(link: StaffLinkParams) {
  return useQuery({
    queryKey: staffKeys.valetTrip(link),
    queryFn: () => staffApi.getValetTrip(link, link.id),
    enabled: !!link.id && !!link.gear && !!link.token,
    // Loaded once: no polling, and no reload on coming back to the tab
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

// The valet's next update. The trip's details are invalidated, so they load
// again (the update stays pending until they have, so the button never shows the
// step just done), and the task list is marked stale. Like the other staff
// mutations a failure is toasted here and the trip refetched.
export function useAdvanceValetTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (link: StaffLinkParams) => staffApi.advanceValetTrip(link, link.id),
    onSuccess: (_, link) => {
      queryClient.invalidateQueries({ queryKey: ["staff", "tasks"] });
      return queryClient.invalidateQueries({ queryKey: staffKeys.valetTrip(link) });
    },
    onError: (error, link) => {
      staffToast.error(errorMessage(error));
      queryClient.invalidateQueries({ queryKey: staffKeys.valetTrip(link) });
    },
  });
}

// A booking of the signed-in advisor (still the mock's)
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
