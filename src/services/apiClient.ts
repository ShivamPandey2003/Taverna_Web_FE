import { toast } from "sonner";
import { apiRequest } from "./apiService";

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

// Assumes the backend wraps payloads as { code, message, data }
export async function request<T>(method: Method, url: string, data?: unknown): Promise<T> {
  const body = await apiRequest(method, url, data ?? null);
  return (body?.data ?? body?.response?.data ?? body?.response ?? body) as T;
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
