import { z } from "zod";

export const dealershipSchema = z.object({
  // The dealer's own ID. Only asked for (and required) when adding.
  dealerId: z.string().trim().max(100, "Dealer ID is too long"),

  name: z
    .string()
    .trim()
    .min(2, "Dealership name is required")
    .max(100, "Dealership name is too long"),

  address: z
    .string()
    .trim()
    .min(5, "Address is required"),

  // An empty number input comes through as NaN (the input uses valueAsNumber)
  serviceRadiusMiles: z
    .number({ error: "Enter the service radius" })
    .positive("The service radius must be more than 0")
    .max(500, "The service radius is too large"),

  timezone: z.string().min(1, "Choose a timezone"),

  isActive: z.boolean(),
});

export type DealershipFormData = z.infer<typeof dealershipSchema>;
