import { toast } from "sonner";
import { apiRequest, staffApiRequest } from "./apiService";

// Until the backend is ready every call is answered by services/mock/mockServer.ts.
// Set VITE_USE_MOCK_API=false in .env to send the same calls to VITE_REACT_APP_API_URL.
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== "false";

const MOCK_LATENCY_MS = 350;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Runs the mock handler or the real request. Mock errors are toasted the same
// way apiRequest toasts real API errors, so callers never toast errors themselves.
export async function callApi<T>(
  mock: () => T,
  real: () => Promise<T>,
): Promise<T> {
  if (!USE_MOCK_API) {
    return real();
  }

  await delay(MOCK_LATENCY_MS);

  try {
    // Copy so cached query data can't be mutated through the mock database
    return structuredClone(mock());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong. Please try again.";
    toast.error(message);
    throw error;
  }
}

type Method = "get" | "post" | "put" | "delete";

// The backend wraps payloads as { code, message, response }
export async function request<T>(method: Method, url: string, data?: unknown): Promise<T> {
  const body = await apiRequest(method, url, data ?? null);
  return (body?.data ?? body?.response?.data ?? body?.response ?? body) as T;
}

// Staff link calls: answered by the same mock, or sent with the link's token.
// Unlike callApi these never toast (see staffApiRequest).
export async function callStaffApi<T>(mock: () => T, real: () => Promise<T>): Promise<T> {
  if (!USE_MOCK_API) {
    return real();
  }

  await delay(MOCK_LATENCY_MS);
  return structuredClone(mock());
}

export async function staffRequest<T>(
  token: string,
  method: Method,
  url: string,
  data?: unknown,
): Promise<T> {
  const body = await staffApiRequest(token, method, url, data ?? null);
  return (body?.data ?? body) as T;
}

export function toQueryString(params: Record<string, string | number>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}
