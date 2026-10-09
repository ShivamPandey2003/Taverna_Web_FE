import { callApi, request } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import type { AdminBooking } from "@/types/admin";

export type CreateBookingInput = Parameters<typeof mockServer.createBooking>[0];

// Customer-side booking endpoints
export const bookingApi = {
  create: (input: CreateBookingInput) =>
    callApi(
      () => mockServer.createBooking(input),
      () => request<AdminBooking>("post", "/bookings", input),
    ),

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
