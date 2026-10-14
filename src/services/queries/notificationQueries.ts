import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/services/notificationApi";
import type { Notification } from "@/types/notification";

export const notificationKeys = {
  list: ["notifications"] as const,
};

const REFRESH_MS = 30_000;

// The customer's notifications, newest first. Polled, so new ones show up while
// the app is open. The API layer toasts a failure, so it isn't retried.
export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => notificationApi.list(),
    enabled,
    refetchInterval: REFRESH_MS,
    retry: false,
  });
}

// Marks them read in the cache straight away, puts them back if the call fails,
// and loads the list again either way
function useReadMutation<T>(
  mutationFn: (arg: T) => Promise<unknown>,
  isTarget: (item: Notification, arg: T) => boolean,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (arg: T) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.list });
      const previous = queryClient.getQueryData<Notification[]>(notificationKeys.list);
      queryClient.setQueryData<Notification[]>(notificationKeys.list, (items) =>
        items?.map((item) => (isTarget(item, arg) ? { ...item, read: true } : item)),
      );
      return { previous };
    },
    onError: (_error, _arg, context) => {
      if (context?.previous) queryClient.setQueryData(notificationKeys.list, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
  });
}

export const useMarkNotificationRead = () =>
  useReadMutation((id: string) => notificationApi.markRead(id), (item, id) => item.id === id);

export const useMarkAllNotificationsRead = () =>
  useReadMutation<void>(() => notificationApi.markAllRead(), () => true);
