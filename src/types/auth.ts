export type UserRole = "user" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}
