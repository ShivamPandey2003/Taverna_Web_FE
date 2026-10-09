// The logged-in customer's profile, from user/profile
export interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

// What can be changed; the email can't
export type ProfileInput = Pick<Profile, "firstName" | "lastName" | "phone">;
