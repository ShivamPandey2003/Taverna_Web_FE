import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/services/profileApi";

export const profileKeys = {
  profile: ["profile"] as const,
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
