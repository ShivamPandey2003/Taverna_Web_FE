import { z } from "zod";

export const dealershipSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Dealership name is required")
    .max(100, "Dealership name is too long"),

  address: z
    .string()
    .trim()
    .min(5, "Address is required"),

  image: z.union([
    z.literal(""),
    z.string().trim().url("Enter a valid image URL"),
  ]),

  valetAvailable: z.boolean(),

  loanerAvailable: z.boolean(),
});

export type DealershipFormData = z.infer<typeof dealershipSchema>;
