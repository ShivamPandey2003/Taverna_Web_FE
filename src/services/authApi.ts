import { callApi, request } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import type { AuthSession, AuthUser } from "@/types/auth";

export const authApi = {
  sendLoginOtp: (email: string) =>
    callApi(
      () => mockServer.sendLoginOtp(email),
      () => request<{ sent: boolean }>("post", "/auth/login/otp", { email }),
    ),

  signup: (data: { name: string; email: string; phone: string; notifications: boolean }) =>
    callApi(
      () => mockServer.signup(data),
      () => request<{ sent: boolean }>("post", "/auth/signup", data),
    ),

  // Returns the session token and the user, including their role
  verifyOtp: (email: string, otp: string) =>
    callApi(
      () => mockServer.verifyOtp(email),
      () => request<AuthSession>("post", "/auth/otp/verify", { email, otp }),
    ),

  updateMe: (patch: Partial<Pick<AuthUser, "name" | "phone">>) =>
    callApi(
      () => mockServer.updateMe(patch),
      () => request<AuthUser>("put", "/users/me", patch),
    ),
};
