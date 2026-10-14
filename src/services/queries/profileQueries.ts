import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/services/profileApi";
import type { NotificationPreferences } from "@/types/profile";

export const profileKeys = {
  profile: ["profile"] as const,
  notificationPreferences: ["profile", "notification-preferences"] as const,
};

// The logged-in customer's profile. useSyncProfile copies the result into Redux
// (`account.user`), which is where the navbar and the booking pages read it from.
export function useProfile(enabled = true) {
  return useQuery({
    queryKey: profileKeys.profile,
    queryFn: profileApi.get,
    enabled,
    // The API layer toasts every failure, so retrying would repeat the toast
    retry: false,
  });
}

// Saves the profile and puts the server's answer in the cache
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.update,
    onSuccess: (profile) => queryClient.setQueryData(profileKeys.profile, profile),
  });
}

// How the customer wants to hear about their bookings (email, SMS, push)
export function useNotificationPreferences() {
  return useQuery({
    queryKey: profileKeys.notificationPreferences,
    queryFn: profileApi.getNotificationPreferences,
    retry: false,
  });
}

// Saves all three flags. The switch moves straight away and moves back if the
// save fails (the API layer toasts it); the server's answer is kept after.
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const key = profileKeys.notificationPreferences;

  return useMutation({
    mutationFn: profileApi.updateNotificationPreferences,
    onMutate: async (preferences: NotificationPreferences) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<NotificationPreferences>(key);
      queryClient.setQueryData(key, preferences);
      return { previous };
    },
    onError: (_error, _preferences, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (saved) => queryClient.setQueryData(key, saved),
  });
}
