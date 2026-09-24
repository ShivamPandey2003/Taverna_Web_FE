import { useNavigate } from "react-router";

import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { OtpForm } from "./OtpForm";
import HeroImage from '@/assets/background.webp'

import type {
  LoginFormData,
  SignupFormData,
  OtpFormData,
} from "@/schema/auth.schema";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  backToAuthForm,
  loginSucceeded,
  otpRequested,
  selectAuth,
  setAuthMode,
  type AuthMode,
} from "@/redux/auth/authSlice";
import {
  closeAuthModal,
  selectHomeModal,
} from "@/redux/modals/homeModal/homeModalSlice";
import { authApi } from "@/services/authApi";

export function AuthModal() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { authModalOpen } = useAppSelector(selectHomeModal);
  const { mode, step, email } = useAppSelector(selectAuth);

  if (!authModalOpen) {
    return null;
  }

  const onClose = () => dispatch(closeAuthModal());

  // API errors are toasted by the API layer; the form just stays on the current step
  const handleLogin = async (
    data: LoginFormData
  ) => {
    try {
      await authApi.sendLoginOtp(data.email);
      dispatch(otpRequested(data.email));
    } catch {
      // already reported
    }
  };

  const handleSignup = async (
    data: SignupFormData
  ) => {
    try {
      await authApi.signup({
        name: data.fullname,
        email: data.email,
        phone: data.phone,
        notifications: data.notification_preferences,
      });
      dispatch(otpRequested(data.email));
    } catch {
      // already reported
    }
  };

  // Customers and admins share this flow; the role in the response decides where they land
  const handleOtp = async (
    data: OtpFormData
  ) => {
    try {
      const session = await authApi.verifyOtp(email, data.otp);
      dispatch(loginSucceeded(session));
      onClose();
      navigate(session.user.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      // already reported
    }
  };

  const switchMode = (newMode: AuthMode) => {
    dispatch(setAuthMode(newMode));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">

      {/* Modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm transition hover:bg-white hover:text-black"
          aria-label="Close"
        >
          ×
        </button>

        {/* IMAGE */}
        <div className="relative hidden w-1/2 md:block">

          <img
            src={HeroImage}
            alt="Taverna dealership"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Image content */}
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white font-bold text-primary">
                T
              </div>

              <span className="text-lg font-bold">
                Taverna
              </span>
            </div>

            <h2 className="max-w-sm text-3xl font-bold leading-tight">
              Your car deserves concierge-level care.
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-5 text-white/80">
              Book your vehicle service without waiting
              at the dealership.
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="flex w-full flex-col overflow-y-auto md:w-1/2">

          <div className="flex min-h-full flex-col justify-center px-7 py-10 sm:px-10">

            {step === "form" ? (
              <>
                {/* Header */}
                <div className="mb-7">
                  <p className="text-sm font-semibold text-primary">
                    Welcome to Taverna
                  </p>

                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                    {mode === "login"
                      ? "Welcome back"
                      : "Create your account"}
                  </h1>

                  <p className="mt-2 text-sm text-gray-500">
                    {mode === "login"
                      ? "Sign in to manage your vehicle services."
                      : "Get started with effortless vehicle care."}
                  </p>
                </div>

                {/* Tabs */}
                <div className="mb-7 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className={`rounded-md py-2 text-sm font-semibold transition ${
                      mode === "login"
                        ? "bg-white text-gray-950 shadow-sm"
                        : "text-gray-500"
                    }`}
                  >
                    Log in
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className={`rounded-md py-2 text-sm font-semibold transition ${
                      mode === "signup"
                        ? "bg-white text-gray-950 shadow-sm"
                        : "text-gray-500"
                    }`}
                  >
                    Sign up
                  </button>
                </div>

                {mode === "login" ? (
                  <LoginForm
                    onSubmit={handleLogin}
                  />
                ) : (
                  <SignupForm
                    onSubmit={handleSignup}
                  />
                )}
              </>
            ) : (
              <OtpForm
                email={email}
                onSubmit={handleOtp}
                onBack={() => dispatch(backToAuthForm())}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}