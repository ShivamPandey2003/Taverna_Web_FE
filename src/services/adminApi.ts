import { callApi, request, toQueryString } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import type {
  AdminBooking,
  BookingListParams,
  Paginated,
  PaymentInfo,
  StaffMember,
} from "@/types/admin";

export type PaymentInput = Omit<PaymentInfo, "updatedAt">;

// Sorting, filtering, search and pagination all happen on the server
export const adminApi = {
  listBookings: (params: BookingListParams) =>
    callApi(
      () => mockServer.listBookings(params),
      () =>
        request<Paginated<AdminBooking>>(
          "get",
          `/admin/bookings${toQueryString({ ...params })}`,
        ),
    ),

  getBooking: (id: string) =>
    callApi(
      () => mockServer.getBooking(id),
      () => request<AdminBooking>("get", `/admin/bookings/${id}`),
    ),

  confirmBooking: (id: string) =>
    callApi(
      () => mockServer.confirmBooking(id),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/confirm`),
    ),

  assignValet: (id: string, valetId: string) =>
    callApi(
      () => mockServer.assignValet(id, valetId),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/valet`, { valetId }),
    ),

  assignRelationshipManager: (id: string, managerId: string) =>
    callApi(
      () => mockServer.assignRelationshipManager(id, managerId),
      () =>
        request<AdminBooking>("put", `/admin/bookings/${id}/relationship-manager`, {
          managerId,
        }),
    ),

  updatePayment: (id: string, payment: PaymentInput) =>
    callApi(
      () => mockServer.updatePayment(id, payment),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/payment`, payment),
    ),

  listValets: () =>
    callApi(
      () => mockServer.listValets(),
      () => request<StaffMember[]>("get", "/admin/valets"),
    ),

  listRelationshipManagers: () =>
    callApi(
      () => mockServer.listRelationshipManagers(),
      () => request<StaffMember[]>("get", "/admin/relationship-managers"),
    ),
};
