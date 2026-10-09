import { z } from "zod";

const text = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

// Empty number inputs come through as NaN (the inputs use valueAsNumber)
const amount = (label: string) =>
  z.number({ error: `Enter the ${label}` }).min(0, `The ${label} can't be negative`);

// An offer as the admin edits it: the same fields as a row of the offers CSV
export const offerSchema = z.object({
  vin: z
    .string()
    .trim()
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/i, "Enter a valid 17-character VIN"),
  stockNumber: text("Stock number", 40),
  brand: text("Brand", 40),
  year: z
    .number({ error: "Enter the year" })
    .int("Enter a whole year")
    .min(1990, "Enter a valid year")
    .max(2100, "Enter a valid year"),
  model: text("Model", 60),
  trim: z.string().trim().max(60, "Trim is too long"),
  condition: text("Condition", 40),
  offerType: text("Offer type", 80),
  payment: amount("payment"),
  paymentNoTax: amount("payment before tax"),
  totalRebate: amount("total rebate"),
  term: z
    .number({ error: "Enter the term" })
    .int("Enter whole months")
    .min(1, "Enter the term in months"),
  downPayment: amount("down payment"),
  dueAtSigning: amount("amount due at signing"),
  apr: amount("APR").max(100, "Enter the APR as a percentage"),
  lender: text("Lender", 80),
  description: z.string().trim().max(500, "Description is too long"),
  disclaimer: z.string().trim().max(2000, "Disclaimer is too long"),
});

export type OfferFormData = z.infer<typeof offerSchema>;
