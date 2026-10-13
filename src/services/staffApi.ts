import { callStaffApi, staffRequest } from "./apiClient";
import { mockServer } from "./mock/mockServer";
import type {
  AdvisorMilestone,
  InvoiceLine,
  StaffAuth,
  StaffBooking,
  StaffType,
  ValetLeg,
  ValetMilestone,
} from "@/types/admin";

// The real API's `user_type` for each kind of staff
const userTypes: Record<StaffType, number> = { advisor: 1, valet: 2 };

// POST staff/verify-otp
interface StaffSessionResponse {
  accessToken: string;
  expiresInSeconds: number;
  staff: { name: string; email: string; phone: string };
  user_type: number;
}

// Endpoints the valet / advisor pages call. Staff have their own sign-in,
// separate from the app's: every call takes the page's StaffAuth (from the
// link's search params or the email + OTP form) and sends `gear` as the Bearer
// token with the staff type next to it. The sign-in is the real API; the booking
// calls mirror the admin endpoints (adminApi.ts) under /staff and are still
// proposed paths, answered by the mock.
export const staffApi = {
  // Emails a one-time password to a valet or advisor; asking again sends a new one
  sendOtp: (email: string, type: StaffType) =>
    staffRequest(null, "post", "staff/login", { email, user_type: userTypes[type] }),

  // The access token becomes the sign-in's `gear`
  verifyOtp: async (email: string, otp: string, type: StaffType): Promise<StaffAuth> => {
    const session = await staffRequest<StaffSessionResponse>(null, "post", "staff/verify-otp", {
      email,
      otp,
      user_type: userTypes[type],
    });
    return { gear: session.accessToken, token: type, email: session.staff?.email ?? email };
  },

  // Every booking the signed-in valet / advisor is assigned to; `linkRoles` says
  // which of each booking's pages are theirs (proposed path)
  listBookings: (auth: StaffAuth) =>
    callStaffApi(
      () => mockServer.listStaffBookings(auth),
      () => staffRequest<StaffBooking[]>(auth, "get", "/staff/bookings"),
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
