import { callApi, request, toQueryString } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import type {
  AdminBooking,
  BookingListParams,
  Paginated,
  PaymentInfo,
  StaffListParams,
  StaffMember,
  StaffRole,
} from "@/types/admin";
import type { Dealership } from "@/types/dealership";

export type PaymentInput = Omit<PaymentInfo, "updatedAt">;
export type StaffInput = Pick<StaffMember, "name" | "phone" | "available">;

// Valets and relationship managers share one API shape under different paths
const staffPaths: Record<StaffRole, string> = {
  valet: "/admin/valets",
  manager: "/admin/relationship-managers",
};
export type DealershipInput = Omit<Dealership, "id">;

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

  completeBooking: (id: string) =>
    callApi(
      () => mockServer.completeBooking(id),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/complete`),
    ),

  listStaff: (role: StaffRole, params: StaffListParams) =>
    callApi(
      () => mockServer.listStaff(role, params),
      () =>
        request<Paginated<StaffMember>>(
          "get",
          `${staffPaths[role]}${toQueryString({ ...params })}`,
        ),
    ),

  createStaff: (role: StaffRole, input: StaffInput) =>
    callApi(
      () => mockServer.createStaff(role, input),
      () => request<StaffMember>("post", staffPaths[role], input),
    ),

  updateStaff: (role: StaffRole, id: string, input: StaffInput) =>
    callApi(
      () => mockServer.updateStaff(role, id, input),
      () => request<StaffMember>("put", `${staffPaths[role]}/${id}`, input),
    ),

  deleteStaff: (role: StaffRole, id: string) =>
    callApi(
      () => mockServer.deleteStaff(role, id),
      () => request<{ id: string }>("delete", `${staffPaths[role]}/${id}`),
    ),

  listDealerships: (search: string) =>
    callApi(
      () => mockServer.listDealerships(search),
      () => request<Dealership[]>("get", `/admin/dealerships${toQueryString({ search })}`),
    ),

  createDealership: (input: DealershipInput) =>
    callApi(
      () => mockServer.createDealership(input),
      () => request<Dealership>("post", "/admin/dealerships", input),
    ),
};
