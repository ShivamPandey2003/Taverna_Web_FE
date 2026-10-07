import { callStaffApi, staffRequest } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import type {
  AdvisorMilestone,
  InvoiceLine,
  StaffAuth,
  StaffBooking,
  ValetLeg,
  ValetMilestone,
} from "@/types/admin";

// Endpoints the valet / advisor pages call. They mirror the admin endpoints
// (adminApi.ts) under /staff. Staff have their own sign-in, separate from the
// app's: every call takes the page's StaffAuth (from the link's search params or
// the email + OTP form) and sends `gear` as the Bearer token with the encrypted
// staff type next to it. Agree the final paths with the backend.
export const staffApi = {
  // Emails a one-time password to a valet or advisor
  sendOtp: (email: string) =>
    callStaffApi(
      () => mockServer.sendStaffOtp(email),
      () => staffRequest<{ sent: boolean }>(null, "post", "/staff/auth/login", { email }),
    ),

  // Returns what the link's search params would have carried
  verifyOtp: (email: string, otp: string) =>
    callStaffApi(
      () => mockServer.verifyStaffOtp(email),
      () => staffRequest<StaffAuth>(null, "post", "/staff/auth/verify_otp", { email, otp }),
    ),

  getBooking: (auth: StaffAuth, id: string) =>
    callStaffApi(
      () => mockServer.getStaffBooking(auth, id),
      () => staffRequest<StaffBooking>(auth, "get", `/staff/bookings/${id}`),
    ),

  // Marks the next milestone of a valet trip (milestones go in order)
  updateValetProgress: (auth: StaffAuth, id: string, leg: ValetLeg, milestone: ValetMilestone) =>
    callStaffApi(
      () => mockServer.staffUpdateValetProgress(auth, id, leg, milestone),
      () =>
        staffRequest<StaffBooking>(auth, "put", `/staff/bookings/${id}/valet/progress`, {
          leg,
          milestone,
        }),
    ),

  // Service updates the advisor shares with the customer (in order)
  updateAdvisorProgress: (auth: StaffAuth, id: string, milestone: AdvisorMilestone) =>
    callStaffApi(
      () => mockServer.staffUpdateAdvisorProgress(auth, id, milestone),
      () =>
        staffRequest<StaffBooking>(
          auth,
          "put",
          `/staff/bookings/${id}/relationship-manager/progress`,
          { milestone },
        ),
    ),

  // Sends the customer the bill the advisor filled in; the server adds tax and totals it
  generateInvoice: (auth: StaffAuth, id: string, items: InvoiceLine[]) =>
    callStaffApi(
      () => mockServer.staffGenerateInvoice(auth, id, items),
      () => staffRequest<StaffBooking>(auth, "post", `/staff/bookings/${id}/invoice`, { items }),
    ),

  // The advisor has checked that the customer paid the invoice
  confirmPayment: (auth: StaffAuth, id: string) =>
    callStaffApi(
      () => mockServer.staffConfirmPayment(auth, id),
      () => staffRequest<StaffBooking>(auth, "put", `/staff/bookings/${id}/payment/confirm`),
    ),
};
