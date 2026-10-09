import { toast } from "sonner";
import { request } from "./apiClient";
import type { AuthSession, UserRole } from "@/types/auth";

export interface SignupPayload {
  fullname: string;
  email: string;
  phone_number: string;
  notification_preferences: boolean;
  privacy_policy: boolean;
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null;

// First of `keys` that holds a non-empty string or a number
function pick(source: Json, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value) return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

// The payload of a JWT, for whatever the response body doesn't spell out
function tokenClaims(token: string): Json {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims: unknown = JSON.parse(atob(payload));
    return isObject(claims) ? claims : {};
  } catch {
    return {};
  }
}

// Turns the verify_otp response into the app's session. The backend doesn't
// document this response, so the token and the user are read from the usual
// places (snake_case or camelCase, user nested or flat) and from the token itself.
function toSession(raw: unknown, email: string): AuthSession {
  const body = isObject(raw) ? raw : {};
  const tokens = isObject(body.tokens) ? body.tokens : body;
  const token = pick(tokens, "access_token", "accessToken", "token");
  if (!token) {
    // Not an API error, so the API layer hasn't toasted anything
    const message = "We couldn't log you in. Please try again.";
    toast.error(message);
    throw new Error(message);
  }

  const user = [body.user, body.customer, body.profile].find(isObject) ?? body;
  const claims = tokenClaims(token);
  const roleText = `${pick(user, "role", "user_type", "userType")} ${pick(claims, "role", "user_type", "userType")}`;
  const role: UserRole = /admin/i.test(roleText) ? "admin" : "user";

  return {
    token,
    user: {
      id: pick(user, "id", "user_id", "userId", "customer_id") || pick(claims, "sub", "user_id") || email,
      name: pick(user, "fullname", "full_name", "fullName", "name") || email.split("@")[0],
      email: pick(user, "email") || email,
      phone: pick(user, "phone_number", "phoneNumber", "phone"),
      role,
    },
  };
}

export const authApi = {
  // Sends a login OTP to an existing account's email
  login: (email: string) => request<unknown>("post", "auth/login", { email }),

  // Creates the account and sends its verification OTP
  signup: (payload: SignupPayload) => request<unknown>("post", "auth/signup", payload),

  // Works after either login or signup, with the backend's cooldown and limits
  resendOtp: (email: string) => request<unknown>("post", "auth/resend_otp", { email }),

  // Returns the session token and the user, including their role
  verifyOtp: async (email: string, otp: string) =>
    toSession(await request<unknown>("post", "auth/verify_otp", { email, otp }), email),

  // Revokes the tokens of the logged-in account (needs only the access token)
  logout: () => request<unknown>("post", "auth/logout"),
};
