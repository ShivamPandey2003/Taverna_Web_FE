import { callStaffApi, staffRequest } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import type {
  AdvisorMilestone,
  InvoiceLine,
  StaffBooking,
  ValetLeg,
  ValetMilestone,
} from "@/types/admin";

// Endpoints the valet / advisor links call. They mirror the admin endpoints
// (adminApi.ts) under /staff. Staff never log in: every call takes the token
// from the link's route and sends it as the Bearer token. Agree the final paths
// with the backend.
export const staffApi = {
  getBooking: (token: string, id: string) =>
    callStaffApi(
      () => mockServer.getStaffBooking(token, id),
      () => staffRequest<StaffBooking>(token, "get", `/staff/bookings/${id}`),
    ),

  // Marks the next milestone of a valet trip (milestones go in order)
  updateValetProgress: (token: string, id: string, leg: ValetLeg, milestone: ValetMilestone) =>
    callStaffApi(
      () => mockServer.staffUpdateValetProgress(token, id, leg, milestone),
      () =>
        staffRequest<StaffBooking>(token, "put", `/staff/bookings/${id}/valet/progress`, {
          leg,
          milestone,
        }),
    ),

  // Service updates the advisor shares with the customer (in order)
  updateAdvisorProgress: (token: string, id: string, milestone: AdvisorMilestone) =>
    callStaffApi(
      () => mockServer.staffUpdateAdvisorProgress(token, id, milestone),
      () =>
        staffRequest<StaffBooking>(
          token,
          "put",
          `/staff/bookings/${id}/relationship-manager/progress`,
          { milestone },
        ),
    ),

  // Sends the customer the bill the advisor filled in; the server adds tax and totals it
  generateInvoice: (token: string, id: string, items: InvoiceLine[]) =>
    callStaffApi(
      () => mockServer.staffGenerateInvoice(token, id, items),
      () => staffRequest<StaffBooking>(token, "post", `/staff/bookings/${id}/invoice`, { items }),
    ),

  // The advisor has checked that the customer paid the invoice
  confirmPayment: (token: string, id: string) =>
    callStaffApi(
      () => mockServer.staffConfirmPayment(token, id),
      () => staffRequest<StaffBooking>(token, "put", `/staff/bookings/${id}/payment/confirm`),
    ),
};
