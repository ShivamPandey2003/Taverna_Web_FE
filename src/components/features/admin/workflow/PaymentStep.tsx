import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { AdminBooking } from "@/types/admin";
import { useUpdatePayment } from "@/services/queries/adminQueries";
import { paymentSchema, type PaymentFormData } from "@/schema/payment.schema";
import { formatCurrency, formatDateTime } from "../admin.utils";
import { StepDone } from "./ConfirmStep";

const methods: { value: PaymentFormData["method"]; label: string }[] = [
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "insurance", label: "Insurance" },
  { value: "warranty", label: "Warranty" },
];

const statuses: { value: PaymentFormData["status"]; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
];

export function PaymentStep({ booking }: { booking: AdminBooking }) {
  const updatePayment = useUpdatePayment();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: booking.payment?.amount,
      method: booking.payment?.method ?? "card",
      status: booking.payment?.status ?? "pending",
      transactionId: booking.payment?.transactionId ?? "",
    },
  });

  const onSubmit = (payment: PaymentFormData) => {
    updatePayment.mutate(
      { id: booking.id, payment },
      {
        onSuccess: () => toast.success(`Payment updated for ${booking.id}`),
      },
    );
  };

  return (
    <div className="space-y-4">
      {booking.payment && (
        <StepDone
          text={`${formatCurrency(booking.payment.amount)} · ${booking.payment.status} · updated ${formatDateTime(booking.payment.updatedAt)}`}
        />
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-xl border border-gray-200 p-5"
      >
        <h3 className="text-base font-bold text-gray-900">Payment information</h3>
        <p className="mt-1 text-sm text-gray-500">
          Record what the customer owes or has paid for this service.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Amount (USD)" error={errors.amount?.message}>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
              className="form-input"
            />
          </Field>

          <Field label="Payment method" error={errors.method?.message}>
            <select {...register("method")} className="form-input">
              {methods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Payment status" error={errors.status?.message}>
            <select {...register("status")} className="form-input">
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Transaction / reference ID (optional)" error={errors.transactionId?.message}>
            <input
              placeholder="TXN-123456"
              {...register("transactionId")}
              className="form-input"
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={updatePayment.isPending}
          className="mt-5 h-11 w-full rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {updatePayment.isPending
            ? "Saving..."
            : booking.payment
              ? "Update Payment"
              : "Save Payment"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-gray-600">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
