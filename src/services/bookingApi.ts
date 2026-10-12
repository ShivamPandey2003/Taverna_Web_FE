import { USE_MOCK_API, callApi, request } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import type { AdminBooking } from "@/types/admin";
import { BookingStatus } from "@/types/booking";
import type { ServiceId } from "@/types/service";

// What the mock keeps of a booking, plus the ids the real API books with
export type CreateBookingInput = Parameters<typeof mockServer.createBooking>[0] & {
  vehicleId: string;
  dealershipId: string;
  addressId: string;
};

// POST booking/save
interface SaveBookingResponse {
  bmsId: string;
  status: string;
  bookingStatus: string;
  isActive: number;
  isDriveable: boolean;
  towRequested: boolean;
  bookingType: string;
  appointmentAt: string;
  userMessage: string;
}

const bookingTypes: Record<ServiceId, string> = {
  "pickup-delivery": "PICKUP_AND_DELIVERY",
  "loaner-only": "LOANER_ONLY",
};

const pad = (value: number) => String(value).padStart(2, "0");

// The API reads the date and time as clock time at the dealership, so the time the
// customer picked is sent as shown on their device, not converted to UTC. Without
// a scheduled time both are null, which books for now.
function toAppointment(scheduledAt: string | null) {
  if (!scheduledAt) return { appointmentDate: null, appointmentTime: null };
  const date = new Date(scheduledAt);
  return {
    appointmentDate: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    appointmentTime: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

// Customer-side booking endpoints
export const bookingApi = {
  // The booking is made with the real API. Everything after it (tracking, the admin
  // workflow) is still the mock's, so the mock keeps a copy under the same id.
  create: async ({ vehicleId, dealershipId, addressId, ...booking }: CreateBookingInput) => {
    const saved = await request<SaveBookingResponse>("post", "booking/save", {
      vehicleId,
      dealershipId,
      ...toAppointment(booking.scheduledAt),
      addressId,
      serviceDescription: booking.concern.trim() || null,
      // Every booking asks for a loaner
      loanerRequested: true,
      isDriveable: booking.driveable,
      towRequested: !booking.driveable && booking.towTruck !== false,
      bookingType: bookingTypes[booking.serviceId],
    });

    if (USE_MOCK_API) mockServer.createBooking(booking, saved.bmsId);

    return {
      id: saved.bmsId,
      // A new booking always waits for the dealership to confirm it
      status: BookingStatus.IN_QUEUE,
      createdAt: new Date().toISOString(),
    };
  },

  // The customer's bookings that aren't complete yet (one per vehicle at most),
  // newest first
  getOpen: () =>
    callApi(
      () => mockServer.getMyOpenBookings(),
      () => request<AdminBooking[]>("get", "/bookings/open"),
    ),

  get: (id: string) =>
    callApi(
      () => mockServer.getMyBooking(id),
      () => request<AdminBooking>("get", `/bookings/${id}`),
    ),

  // Only while the booking is In-queue (not yet confirmed by the dealership)
  cancel: (id: string) =>
    callApi(
      () => mockServer.cancelBooking(id),
      () => request<{ id: string }>("delete", `/bookings/${id}`),
    ),

  // Pays the generated invoice
  pay: (id: string) =>
    callApi(
      () => mockServer.payInvoice(id),
      () => request<AdminBooking>("post", `/bookings/${id}/pay`),
    ),

  // Demo only: moves the booking to its next status. The backend drives status
  // for real, so there's no real endpoint; the UI only offers it with USE_MOCK_API.
  simulateNextStatus: (id: string) =>
    callApi(
      () => mockServer.simulateNextStatus(id),
      () => Promise.reject(new Error("Status simulation is only available with the mock API.")),
    ),
};
