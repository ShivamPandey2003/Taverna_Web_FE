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

  // The customer's booking that isn't complete yet, or null
  getOpen: () =>
    callApi(
      () => mockServer.getMyOpenBooking(),
      () => request<AdminBooking | null>("get", "/bookings/open"),
    ),

  get: (id: string) =>
    callApi(
      () => mockServer.getMyBooking(id),
      () => request<AdminBooking>("get", `/bookings/${id}`),
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
