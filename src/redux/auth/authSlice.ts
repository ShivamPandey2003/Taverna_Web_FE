import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { authStorage } from "@/services/authStorage";
import type { AuthSession } from "@/types/auth";

export type AuthMode = "login" | "signup";
export type AuthStep = "form" | "otp";

type AuthState = {
  mode: AuthMode;
  step: AuthStep;
  // Email the OTP was sent to
  email: string;
  // Restored from localStorage so a reload keeps the user logged in
  session: AuthSession | null;
};

const initialState: AuthState = {
  mode: "login",
  step: "form",
  email: "",
  session: authStorage.load(),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthMode: (state, action: PayloadAction<AuthMode>) => {
      state.mode = action.payload;
      state.step = "form";
    },
    otpRequested: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
      state.step = "otp";
    },
    backToAuthForm: (state) => {
      state.step = "form";
    },
    loginSucceeded: (state, action: PayloadAction<AuthSession>) => {
      state.session = action.payload;
      state.step = "form";
    },
    logout: (state) => {
      state.session = null;
      state.step = "form";
      state.email = "";
    },
  },
});

export const { setAuthMode, otpRequested, backToAuthForm, loginSucceeded, logout } =
  authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export const selectSession = (state: RootState) => state.auth.session;

export const selectIsAuthenticated = (state: RootState) => !!state.auth.session;

export const selectIsAdmin = (state: RootState) =>
  state.auth.session?.user.role === "admin";

export default authSlice.reducer;
