import type { AuthSession } from "@/types/auth";

const SESSION_KEY = "taverna_session";

// The logged-in session survives page reloads; "token" is what apiService attaches to requests
export const authStorage = {
  load(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  },

  save(session: AuthSession) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      localStorage.setItem("token", session.token);
    } catch {
      // Storage can be unavailable (private mode); the session then lasts until reload
    }
  },

  clear() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem("token");
    } catch {
      // ignore
    }
  },
};
