import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { staffToast } from "@/components/features/staffPortal/shared/staffToast";
import { errorMessage } from "@/libs/apiError";
import { liveRefetch } from "@/libs/polling";
import { staffApi } from "../staffApi";
import type { InvoiceLine, StaffAuth, StaffType } from "@/types/admin";

// What a staff page works with: the booking from its route and the stored staff
// sign-in (see useStaffAuth)
export interface StaffLinkParams extends StaffAuth {
  id: string;
}

export const staffKeys = {
  allTasks: ["staff", "tasks"] as const,
  tasks: (type: StaffType, { gear, token }: StaffAuth) =>
    ["staff", "tasks", type, gear, token] as const,
  valetTrip: ({ id, gear, token }: StaffLinkParams) =>
    ["staff", "valetTrip", id, gear, token] as const,
  advisorService: ({ id, gear, token }: StaffLinkParams) =>
    ["staff", "advisorService", id, gear, token] as const,
};

// Email + OTP sign-in of the staff pages. Failures are toasted here, like the
// other staff mutations.
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

// Staff pages load again every 5s, so what the customer and the admin do (a
// confirmation, a reassignment) shows without a reload
const live = { refetchOnWindowFocus: false, retry: 1, refetchInterval: liveRefetch } as const;

// The task list of the signed-in valet or advisor
export function useStaffTasks(type: StaffType, auth: StaffAuth) {
  return useQuery({
    queryKey: staffKeys.tasks(type, auth),
    queryFn: () => staffApi.listTasks(type, auth),
    enabled: !!auth.gear && !!auth.token,
    ...live,
  });
}

// A trip of the signed-in valet
export function useValetTrip(link: StaffLinkParams) {
  return useQuery({
    queryKey: staffKeys.valetTrip(link),
    queryFn: () => staffApi.getValetTrip(link, link.id),
    enabled: !!link.id && !!link.gear && !!link.token,
    ...live,
  });
}

// A booking's service, for its signed-in advisor
export function useAdvisorService(link: StaffLinkParams) {
  return useQuery({
    queryKey: staffKeys.advisorService(link),
    queryFn: () => staffApi.getAdvisorService(link, link.id),
    enabled: !!link.id && !!link.gear && !!link.token,
    ...live,
  });
}

// A staff member's next update. The page's details are invalidated, so they load
// again (the update stays pending until they have, so the button never shows the
// step just done), and the task list is marked stale. A failure is toasted here
// (the staff API layer never toasts) and the details refetched: someone else may
// have moved the booking on.
function useAdvance<TInput extends StaffLinkParams, TData>(
  mutationFn: (input: TInput) => Promise<TData>,
  detailsKey: (link: StaffLinkParams) => QueryKey,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.allTasks });
      return queryClient.invalidateQueries({ queryKey: detailsKey(input) });
    },
    onError: (error, input) => {
      staffToast.error(errorMessage(error));
      queryClient.invalidateQueries({ queryKey: detailsKey(input) });
    },
  });
}

export const useAdvanceValetTrip = () =>
  useAdvance((link: StaffLinkParams) => staffApi.advanceValetTrip(link, link.id), staffKeys.valetTrip);

// With `items` the update is the bill being sent (see staffApi.advanceAdvisorService)
export const useAdvanceAdvisorService = () =>
  useAdvance(
    (input: StaffLinkParams & { items?: InvoiceLine[] }) =>
      staffApi.advanceAdvisorService(input, input.id, input.items),
    staffKeys.advisorService,
  );
