import type { AddressPlace } from "@/services/geocodeApi";
import type { Dealership } from "@/types/dealership";

// What a visitor chose on the landing page before signing in: the pickup and
// the dealership. Kept in localStorage so it survives the sign-up / login flow
// and a reload; the dashboard then selects them for the booking
// (usePendingBooking). Cleared once a booking is placed, on logout, and after a
// week.
export interface PendingBooking {
  pickup: {
    // The line the visitor saw ("540 SW 14th Ave, Fort Lauderdale, FL…")
    label: string;
    latitude: number;
    longitude: number;
    // Street / city / state / ZIP when known (the device's location has them; a
    // searched place doesn't, and is looked up when it's saved)
    parts: AddressPlace | null;
  };
  dealership: Dealership | null;
  // The saved address the pickup became, so it's never saved twice
  addressId?: string;
  savedAt: string;
}

const KEY = "taverna_pending_booking";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const pendingBookingStorage = {
  read(): PendingBooking | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const pending = JSON.parse(raw) as PendingBooking;
      const { pickup } = pending;
      const usable =
        !!pickup &&
        Number.isFinite(pickup.latitude) &&
        Number.isFinite(pickup.longitude) &&
        Date.now() - Date.parse(pending.savedAt) < MAX_AGE_MS;
      if (!usable) {
        localStorage.removeItem(KEY);
        return null;
      }
      return pending;
    } catch {
      return null;
    }
  },

  save(pending: Omit<PendingBooking, "savedAt">) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...pending, savedAt: new Date().toISOString() }));
    } catch {
      // Storage can be unavailable (private mode): the choice is then not carried over
    }
  },

  // Remembers the saved address the pickup became
  setAddressId(addressId: string) {
    const pending = pendingBookingStorage.read();
    if (!pending) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...pending, addressId }));
    } catch {
      // As above
    }
  },

  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // As above
    }
  },
};
