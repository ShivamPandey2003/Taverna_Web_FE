import { z } from "zod";

export const profileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name is too long"),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name is too long"),

  phone: z
    .string()
    .trim()
    .min(10, "Please enter a valid phone number")
    .max(20, "Please enter a valid phone number"),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
