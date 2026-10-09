import { request } from "./apiClient";
import type { Profile, ProfileInput } from "@/types/profile";

// GET and PUT user/profile answer with the same shape
interface ProfileResponse {
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  // Has its own endpoint (user/notification-preferences); not used here
  notificationPreferences?: {
    smsEnabled: boolean;
    pushEnabled: boolean;
    emailEnabled: boolean;
  };
}

function toProfile(profile: ProfileResponse): Profile {
  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    email: profile.email,
    phone: profile.phone ?? "",
  };
}

// "Shivam Pandey"; the rest of the app shows one name
export const profileName = (profile: Pick<Profile, "firstName" | "lastName">) =>
  `${profile.firstName} ${profile.lastName}`.trim();

export const profileApi = {
  get: async () => toProfile(await request<ProfileResponse>("get", "user/profile")),

  update: async (input: ProfileInput) =>
    toProfile(await request<ProfileResponse>("put", "user/profile", input)),
};
