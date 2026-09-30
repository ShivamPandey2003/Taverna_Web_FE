// import { CheckCircle } from "reicon-react";
import { toast } from "sonner";
// import { cn } from "@/libs/utils";
import { useCompleteBooking } from "@/services/queries/adminQueries";
import type { AdminBooking } from "@/types/admin";
import { formatCurrency, formatDateTime, isComplete } from "../admin.utils";
import { ActionButton, SectionCard } from "./StepParts";

// Last step. Before completion it offers "Mark Service Complete"; afterwards the
// drawer is locked here and only shows how the service went.
export function CompleteStep({ booking }: { booking: AdminBooking }) {
  const completeBooking = useCompleteBooking();
  const complete = isComplete(booking);

  const handleComplete = () => {
    completeBooking.mutate(booking.id, {
      onSuccess: () => toast.success(`Booking ${booking.id} marked complete`),
    });
  };

  const rows: { label: string; value: string; at?: string | null }[] = [
    { label: "Booking confirmed", value: "By the dealership", at: booking.confirmedAt },
    {
      label: "Pickup valet",
      value: booking.valet?.name ?? "—",
      at: booking.pickupProgress?.delivered,
    },
    {
      label: "Advisor",
      value: booking.relationshipManager?.name ?? "—",
      at: booking.advisorProgress?.readyForDispatch,
    },
    {
      label: "Payment",
      value: booking.payment ? `${formatCurrency(booking.payment.amount)} paid` : "—",
      at: booking.payment?.updatedAt,
    },
    {
      label: "Delivery valet",
      value: booking.deliveryValet?.name ?? "—",
      at: booking.deliveryProgress?.delivered,
    },
  ];

  return (
    <div className="space-y-4">
      {/* <div
        className={cn(
          "flex items-center gap-3 rounded-xl p-4",
          complete ? "bg-gray-100" : "bg-gray-50",
        )}
      >
        <CheckCircle
          size={28}
          className={cn("shrink-0", complete ? "text-black" : "text-gray-400")}
        />
        <div>
          <p className="text-base font-bold text-gray-900">
            {complete ? "Service complete" : "Ready to complete"}
          </p>
          <p className="text-sm text-gray-600">
            {complete
              ? `Completed ${formatDateTime(booking.completedAt ?? null)}. This booking can no longer be changed.`
              : "The vehicle is back with the customer. Completing the service lets them book again."}
          </p>
        </div>
      </div> */}

      <SectionCard>
        <h3 className="mb-3 text-sm font-bold text-gray-900">Summary</h3>
        <dl className="divide-y divide-gray-100">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2.5">
              <dt className="text-sm text-gray-500">{row.label}</dt>
              <dd className="text-right text-sm">
                <span className="font-semibold text-gray-900">{row.value}</span>
                {row.at && (
                  <span className="ml-2 text-xs text-gray-500">{formatDateTime(row.at)}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      {!complete && (
        <ActionButton
          tone="success"
          pending={completeBooking.isPending}
          pendingLabel="Completing..."
          onClick={handleComplete}
        >
          Mark Service Complete
        </ActionButton>
      )}
    </div>
  );
}
