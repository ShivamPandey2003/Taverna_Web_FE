import type { StaffAuth } from "@/types/admin";

// Its own key: the staff sign-in has nothing to do with the app's session
// ("taverna_session" / "token" in authStorage.ts)
const STAFF_AUTH_KEY = "taverna_staff_auth";

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// The valet / advisor sign-in (`gear` + `token`, and who an OTP sign-in is), kept across reloads and pages.
// `subscribe` / `read` feed useSyncExternalStore in useStaffAuth.
export const staffAuthStorage = {
  // The raw JSON, so the same sign-in always reads as the same value
  read(): string | null {
    try {
      return localStorage.getItem(STAFF_AUTH_KEY);
    } catch {
      return null;
    }
  },

  parse(raw: string | null): StaffAuth | null {
    if (!raw) return null;
    try {
      const { gear, token, email, name } = JSON.parse(raw) as Partial<StaffAuth>;
      return gear && token ? { gear, token, email, name } : null;
    } catch {
      return null;
    }
  },

  save(auth: StaffAuth) {
    try {
      localStorage.setItem(STAFF_AUTH_KEY, JSON.stringify(auth));
    } catch {
      // Storage can be unavailable (private mode); the sign-in then lasts until reload
    }
    notify();
  },

  clear() {
    try {
      localStorage.removeItem(STAFF_AUTH_KEY);
    } catch {
      // ignore
    }
    notify();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    // Signing in or out in another tab
    const onStorage = (event: StorageEvent) => {
      if (event.key === STAFF_AUTH_KEY || event.key === null) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
};
