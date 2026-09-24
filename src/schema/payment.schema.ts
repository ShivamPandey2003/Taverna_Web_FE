import { z } from "zod";

export const paymentSchema = z.object({
  amount: z
    .number({ error: "Enter the amount" })
    .positive("Amount must be greater than 0"),

  method: z.enum(["card", "cash", "insurance", "warranty"]),

  status: z.enum(["pending", "paid", "refunded"]),

  transactionId: z.string().trim(),
});

export type PaymentFormData = z.infer<typeof paymentSchema>;
