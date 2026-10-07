import axios from "axios";
import { toast } from "sonner";
import {
  getApiErrorMessage,
  getNetworkErrorMessage,
  getStaffApiErrorMessage,
} from "@/libs/apiError";
import type { StaffAuth } from "@/types/admin";

// Base of every endpoint, e.g. https://dev-api.tavernaservice.com/api/v1/. The local
// .env sets it in full; the deploy workflow only passes the host (VITE_API_BASE_URL).
const apiHost: string | undefined = import.meta.env.VITE_API_BASE_URL;
const apiUrl: string | undefined =
  import.meta.env.VITE_REACT_APP_API_URL || (apiHost ? `${apiHost.replace(/\/$/, "")}/api/v1/` : undefined);

// The API doesn't send CORS headers, so the dev server proxies it (vite.config.ts):
// in dev, requests go to this origin under the same path.
const platform_url = import.meta.env.DEV && apiUrl ? new URL(apiUrl).pathname : apiUrl;

type ApiMethod = "get" | "post" | "put" | "delete";

const apiClient = axios.create({
  baseURL: platform_url,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && (config.url !== "/uam/login")) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
    (response) => {
        const token = response.headers['authorization'];
        if(token){
          localStorage.setItem('token', token)
        }
        return response;
    },
    (error) => Promise.reject(error.response || error.message)
);

const handleSessionExpiration = (): void => {
  sessionStorage.clear();
  localStorage.clear();
  window.location.href = "/";
};

export const apiRequest = async (
  method: ApiMethod,
  url: string,
  // headers?: Record<string, string>,
  data: any = null,
  responseType: "json" | "blob" = "json"
) => {
  // A 401 only means "session expired" when there was a session. Without one it's
  // a plain refusal (e.g. logging in with an email that has no account).
  const hadSession = !!localStorage.getItem("token");

  try {
    // const requestHeaders = { ...headers };
    const response = await apiClient.request({
      method,
      url,
      data,
      // headers: requestHeaders,
      responseType,
    });
    if (responseType === "json") {
      const body = response?.data;
      const code: number | undefined = body?.header?.code ?? body?.code;
      const message: string | undefined = body?.header?.message ?? body?.message;

      if (code === 401 && hadSession) {
        toast.error(getApiErrorMessage(401, message));
        handleSessionExpiration();
        return body;
      }

      if (typeof code === "number" && code >= 400) {
        const friendly = getApiErrorMessage(code, message);
        toast.error(friendly);
        throw new Error(friendly);
      }

      if (body?.code === 200) {
        return body;
      }
      return { response: body };
    } else {
      return { response: response.data, headers: response.headers };
    }
  } catch (error: any) {
    if (error instanceof Error) {
      throw error;
    }

    const status: number | undefined =
      error?.status ?? error?.response?.status ?? error?.data?.code;
    // The API answers errors as { code, message }
    const backendMessage: string | undefined =
      error?.data?.header?.message ??
      error?.data?.message ??
      error?.response?.data?.header?.message ??
      error?.response?.data?.message;

    if (status === 401 && hadSession) {
      const message401 = getApiErrorMessage(401, backendMessage);
      toast.error(message401);
      handleSessionExpiration();
      throw new Error(message401, { cause: error });
    }

    const friendly = status
      ? getApiErrorMessage(status, backendMessage)
      : getNetworkErrorMessage();
    toast.error(friendly);
    throw new Error(friendly, { cause: error });
  }
};

// ---- Staff links (valet / advisor pages) ----

// No interceptors: the staff sign-in comes from the page's URL, never from
// localStorage, and a bad one must not log out whoever is signed in on this browser
const staffClient = axios.create({
  baseURL: platform_url,
});

// Carries the encrypted staff type next to the Bearer token. Agree the header's
// name with the backend.
const STAFF_TYPE_HEADER = "X-Staff-Token";

// Sends `gear` as the Bearer token and `token` in STAFF_TYPE_HEADER; the staff
// sign-in calls pass null. Errors are thrown with a friendly message and never
// toasted: failed loads show an error screen on the page, and failed updates are
// toasted by the staff mutation hooks.
export const staffApiRequest = async (
  auth: StaffAuth | null,
  method: ApiMethod,
  url: string,
  data: unknown = null,
) => {
  try {
    const response = await staffClient.request({
      method,
      url,
      data,
      headers: auth
        ? { Authorization: `Bearer ${auth.gear}`, [STAFF_TYPE_HEADER]: auth.token }
        : undefined,
    });
    const body = response?.data;
    const code: number | undefined = body?.header?.code ?? body?.code;
    const message: string | undefined = body?.header?.message ?? body?.message;

    if (typeof code === "number" && code >= 400) {
      throw new Error(getStaffApiErrorMessage(code, message));
    }
    return body;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const backendMessage: string | undefined =
        error.response?.data?.header?.message ?? error.response?.data?.message;
      const friendly = status
        ? getStaffApiErrorMessage(status, backendMessage)
        : getNetworkErrorMessage();
      throw new Error(friendly, { cause: error });
    }
    if (error instanceof Error) throw error;
    throw new Error(getNetworkErrorMessage(), { cause: error });
  }
};
