import { z } from "zod";
import { OFFER_CONDITIONS } from "@/components/features/offers/offer.utils";

const text = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

// Empty number inputs come through as NaN (the inputs use valueAsNumber)
const amount = (label: string) =>
  z.number({ error: `Enter the ${label}` }).min(0, `The ${label} can't be negative`);

// An offer as the admin edits it: the fields offers/update takes
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
  condition: z.enum(OFFER_CONDITIONS, { error: "Choose New or Used" }),
  offerType: text("Offer type", 100),
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
  description: z.string().trim().max(1000, "Description is too long"),
  disclaimer: z.string().trim().max(3000, "Disclaimer is too long"),
});

export type OfferFormData = z.infer<typeof offerSchema>;
