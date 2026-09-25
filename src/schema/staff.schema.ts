import { z } from "zod";

export const staffSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),

  phone: z
    .string()
    .trim()
    .regex(/^[0-9()+\-\s]+$/, "Phone number can only contain digits")
    .refine((value) => value.replace(/\D/g, "").length >= 10, {
      message: "Phone number must be at least 10 digits",
    }),

  available: z.boolean(),
});

export type StaffFormData = z.infer<typeof staffSchema>;
