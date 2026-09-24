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

  get: (id: string) =>
    callApi(
      () => mockServer.getMyBooking(id),
      () => request<AdminBooking>("get", `/bookings/${id}`),
    ),
};
