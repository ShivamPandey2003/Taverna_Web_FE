import { z } from "zod";

export const addressSchema = z.object({
  type: z.enum(["home", "work", "other"]),

  address: z
    .string()
    .trim()
    .min(1, "Street address is required"),

  apartment: z.string().trim(),

  city: z
    .string()
    .trim()
    .min(1, "City is required"),

  state: z
    .string()
    .trim()
    .min(1, "State is required"),

  zip: z
    .string()
    .trim()
    .min(1, "ZIP code is required"),
});

export type AddressFormData = z.infer<typeof addressSchema>;
