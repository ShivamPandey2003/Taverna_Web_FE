import { useState } from "react";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { OtpForm } from "@/components/features/auth/OtpForm";
import type { LoginFormData, OtpFormData } from "@/schema/auth.schema";
import { useStaffSendOtp, useStaffVerifyOtp } from "@/services/queries/staffQueries";
import { staffToast } from "./staffToast";
import { useStaffAuth } from "./useStaffAuth";

// Shown when the page was opened without `gear` and `token` in its URL: the same
// email + OTP steps as the app's login, but against the staff sign-in, which
// never touches the app's session.
export function StaffLogin() {
  const { signIn } = useStaffAuth();
  const sendOtp = useStaffSendOtp();
  const verifyOtp = useStaffVerifyOtp();
  // Set once the code is sent, which moves on to the OTP step
  const [email, setEmail] = useState("");

  // Failures are toasted by the hooks; the form just stays on the current step
  const handleEmail = async (data: LoginFormData) => {
    try {
      await sendOtp.mutateAsync(data.email);
      setEmail(data.email);
    } catch {
      // already reported
    }
  };

  const handleOtp = async (data: OtpFormData) => {
    try {
      signIn(await verifyOtp.mutateAsync({ email, otp: data.otp }));
    } catch {
      // already reported
    }
  };

  // There is no separate resend call for staff: asking for a code again sends a new one
  const handleResend = () =>
    sendOtp.mutate(email, {
      onSuccess: () => staffToast.success("We sent you a new code"),
    });

  return (
    <div className="page-body pb-8">
      <section className="card mx-auto max-w-md p-6">
        {email ? (
          <OtpForm
            email={email}
            onSubmit={handleOtp}
            onBack={() => setEmail("")}
            onResend={handleResend}
            resending={sendOtp.isPending}
          />
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Staff Sign In</h1>
              <p className="muted mt-2">
                Sign in with your Taverna staff email to open this booking.
              </p>
            </div>
            <LoginForm onSubmit={handleEmail} />
          </>
        )}
      </section>
    </div>
  );
}
