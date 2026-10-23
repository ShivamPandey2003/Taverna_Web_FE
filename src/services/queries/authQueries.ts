import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/services/authApi";

// Auth calls change the session rather than cached server data, so they're plain
// mutations: no query keys to invalidate. Errors are toasted by the API layer.

// Sends a login OTP to an existing account
export function useLogin() {
  return useMutation({ mutationFn: authApi.login });
}

// Creates the account and sends its verification OTP
export function useSignup() {
  return useMutation({ mutationFn: authApi.signup });
}

export function useResendOtp() {
  return useMutation({ mutationFn: authApi.resendOtp });
}

// Resolves to the session (token + user) to put in Redux
export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => authApi.verifyOtp(email, otp),
  });
}

// Revokes the session's tokens on the server; see useLogout for the local side
export function useLogoutRequest() {
  return useMutation({ mutationFn: authApi.logout });
}
