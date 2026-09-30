import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";
import { loginSucceeded, logout } from "@/redux/auth/authSlice";
import { authStorage } from "@/services/authStorage";

export type AccountSection =
  | "account"
  | "notifications"
  | "addresses"
  | "privacy"
  | "support";

export type AccountUser = {
  name: string;
  email: string;
  phone: string;
};

type AccountState = {
  // Profile of whoever is logged in (a customer or an admin)
  user: AccountUser;
  activeSection: AccountSection;
};

const emptyUser: AccountUser = { name: "", email: "", phone: "" };

function toAccountUser(user?: AccountUser | null): AccountUser {
  return user
    ? { name: user.name, email: user.email, phone: user.phone }
    : emptyUser;
}

const initialState: AccountState = {
  user: toAccountUser(authStorage.load()?.user),
  activeSection: "account",
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<AccountUser>>) => {
      state.user = { ...state.user, ...action.payload };
    },
    setActiveSection: (state, action: PayloadAction<AccountSection>) => {
      state.activeSection = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginSucceeded, (state, action) => {
        state.user = toAccountUser(action.payload.user);
        state.activeSection = "account";
      })
      .addCase(logout, () => ({ user: emptyUser, activeSection: "account" as const }));
  },
});

export const { updateProfile, setActiveSection } = accountSlice.actions;

export const selectAccountUser = (state: RootState) => state.account.user;

export const selectActiveSection = (state: RootState) =>
  state.account.activeSection;

export default accountSlice.reducer;
