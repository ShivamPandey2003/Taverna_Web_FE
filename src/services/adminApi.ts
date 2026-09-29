import { callApi, request, toQueryString } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import type {
  AdminBooking,
  AdvisorMilestone,
  BookingListParams,
  Paginated,
  StaffListParams,
  StaffMember,
  StaffRole,
  ValetLeg,
  ValetMilestone,
} from "@/types/admin";
import type { Dealership } from "@/types/dealership";

export type StaffInput = Pick<StaffMember, "name" | "email" | "phone" | "available">;

// Valets and advisors share one API shape under different paths
// (advisors are still "relationship managers" in the API)
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

  // Pickup or delivery valet; assigning someone new restarts that trip
  assignValet: (id: string, leg: ValetLeg, valetId: string) =>
    callApi(
      () => mockServer.assignValet(id, leg, valetId),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/valet`, { leg, valetId }),
    ),

  // Marks the next milestone of a valet trip (milestones go in order)
  updateValetProgress: (id: string, leg: ValetLeg, milestone: ValetMilestone) =>
    callApi(
      () => mockServer.updateValetProgress(id, leg, milestone),
      () =>
        request<AdminBooking>("put", `/admin/bookings/${id}/valet/progress`, {
          leg,
          milestone,
        }),
    ),

  assignRelationshipManager: (id: string, managerId: string) =>
    callApi(
      () => mockServer.assignRelationshipManager(id, managerId),
      () =>
        request<AdminBooking>("put", `/admin/bookings/${id}/relationship-manager`, {
          managerId,
        }),
    ),

  // Service updates the advisor shares with the customer (in order)
  updateAdvisorProgress: (id: string, milestone: AdvisorMilestone) =>
    callApi(
      () => mockServer.updateAdvisorProgress(id, milestone),
      () =>
        request<AdminBooking>("put", `/admin/bookings/${id}/relationship-manager/progress`, {
          milestone,
        }),
    ),

  // Sends the customer the bill; the server works out the amount
  generateInvoice: (id: string) =>
    callApi(
      () => mockServer.generateInvoice(id),
      () => request<AdminBooking>("post", `/admin/bookings/${id}/invoice`),
    ),

  // Marks the bill as paid by the customer
  confirmPayment: (id: string) =>
    callApi(
      () => mockServer.confirmPayment(id),
      () => request<AdminBooking>("put", `/admin/bookings/${id}/payment/confirm`),
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

  updateDealership: (id: string, input: DealershipInput) =>
    callApi(
      () => mockServer.updateDealership(id, input),
      () => request<Dealership>("put", `/admin/dealerships/${id}`, input),
    ),

  deleteDealership: (id: string) =>
    callApi(
      () => mockServer.deleteDealership(id),
      () => request<{ id: string }>("delete", `/admin/dealerships/${id}`),
    ),
};
