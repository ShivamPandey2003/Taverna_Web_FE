import { toast } from "sonner";
import { useAssignRelationshipManager, useConfirmBooking } from "@/services/queries/adminQueries";
import {
  journeyReached,
  SERVICE_INVOICED,
  SERVICE_JOURNEY,
  SERVICE_PAID,
  SERVICE_READY,
  SERVICE_VERIFYING,
  type AdminBooking,
  type Invoice,
} from "@/types/admin";
import { formatCurrency, isComplete, legMethod, staffLink } from "../admin.utils";
import { MilestoneTracker, type Milestone } from "./MilestoneTracker";
import { ActionButton, AssignmentRow, SectionCard, StepDone } from "./StepParts";

interface AdvisorStepProps {
  booking: AdminBooking;
  onDone: () => void;
}

// The advisor is the customer's contact while the vehicle is at the dealership:
// assigned → inspecting → service in progress → invoice generated → payment
// confirmed → ready to dispatch. It's drawn from the API's journey
// (`booking.journey`): the advisor posts their steps and the bill from their own
// page, so the admin only watches those, and then makes the last two: confirming
// the payment (also when the customer paid in the app) and marking the vehicle ready
// to dispatch. The delivery valet stays locked until the last one.
export function AdvisorStep({ booking, onDone }: AdvisorStepProps) {
  const assignAdvisor = useAssignRelationshipManager();
  // The API's one admin confirmation: it applies whichever the stage allows
  const confirm = useConfirmBooking();

  const advisor = booking.relationshipManager;
  const { journey, invoice } = booking;
  const reached = (key: string) => !!journey && journeyReached(journey, key);
  const paid = reached(SERVICE_PAID);
  // The bill is out and not confirmed paid: the admin can confirm the payment.
  // Paid in the app first moves it on to "verification pending", not past it.
  const awaitingPayment = reached(SERVICE_INVOICED) && !paid;
  const paidInApp = journey?.current === SERVICE_VERIFYING;
  const ready = reached(SERVICE_READY);
  const stepLabel = (key: string) => journey?.steps.find((step) => step.key === key)?.label;
  // What comes after: a valet to assign, or (self-drive, as Loaner Only always
  // is) the customer collecting the vehicle, which the handover step confirms
  const nextLabel =
    legMethod(booking, "delivery") === "valet"
      ? "Next: Assign Delivery Valet"
      : "Next: Vehicle Handover";

  // The API only says when the current step was reached
  const milestones: Milestone[] = SERVICE_JOURNEY.flatMap((key) => {
    const label = stepLabel(key);
    if (!label) return [];
    return [
      {
        key,
        label,
        done: reached(key),
        at: key === journey?.current ? (journey.doneAt ?? undefined) : undefined,
      },
    ];
  });

  const confirmStep = (message: string) =>
    confirm.mutate(booking.id, { onSuccess: () => toast.success(message) });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        The customer's contact at the dealership. They share inspection and service updates,
        the invoice and the payment, then hand the vehicle over for delivery.
      </p>

      <AssignmentRow
        role="manager"
        title="Advisor"
        booking={booking}
        assigned={advisor}
        link={staffLink(booking, "advisor")}
        saving={assignAdvisor.isPending}
        lockedReason={
          isComplete(booking) ? "The service is complete, so the advisor can't be changed." : undefined
        }
        onAssign={(member, done) =>
          assignAdvisor.mutate(
            { id: booking.id, managerId: member.id },
            {
              onSuccess: () => {
                toast.success(`${member.name} assigned as advisor`);
                done();
              },
            },
          )
        }
      />

      {/* There's nothing to follow until an advisor is assigned */}
      {advisor && (
        <SectionCard>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-gray-900">Service Progress</h3>
          </div>

          <MilestoneTracker milestones={milestones} />
        </SectionCard>
      )}

      {invoice && (
        <BillSummary
          invoice={invoice}
          state={paid ? "paid" : paidInApp ? "verifying" : "awaiting"}
        />
      )}

      {!advisor && (
        <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
          Select an advisor to continue...
        </p>
      )}

      {advisor && awaitingPayment && (
        <>
          <p className="text-xs text-gray-500">
            {paidInApp
              ? "The customer has paid from their tracking page. Check the payment came through, then confirm it."
              : "The customer can pay from their tracking page. Confirm here if they paid another way."}
          </p>
          <ActionButton
            pending={confirm.isPending}
            pendingLabel="Confirming..."
            onClick={() => confirmStep(`Payment confirmed for ${booking.id}`)}
          >
            Confirm Payment Received
          </ActionButton>
        </>
      )}

      {advisor && journey?.current === SERVICE_PAID && (
        <>
          <p className="text-xs text-gray-500">
            The bill is paid. Mark the vehicle ready once it's handed back to the dealership for
            delivery.
          </p>
          <ActionButton
            pending={confirm.isPending}
            onClick={() => confirmStep("Vehicle ready to dispatch")}
          >
            Mark “Vehicle Ready to Dispatch”
          </ActionButton>
        </>
      )}

      {ready && (
        <StepDone
          text={stepLabel(SERVICE_READY) ?? "Ready to dispatch"}
          actionLabel={isComplete(booking) ? undefined : nextLabel}
          onAction={onDone}
        />
      )}
    </div>
  );
}

// The bill as the customer sees it
const BILL_STATES = {
  paid: { label: "Paid", className: "bg-gray-100 text-gray-900" },
  verifying: { label: "Paid · Verification pending", className: "bg-orange-50 text-status-pending" },
  awaiting: { label: "Awaiting payment", className: "bg-orange-50 text-status-pending" },
};

function BillSummary({ invoice, state }: { invoice: Invoice; state: keyof typeof BILL_STATES }) {
  return (
    <SectionCard>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">Bill</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${BILL_STATES[state].className}`}
        >
          {BILL_STATES[state].label}
        </span>
      </div>

      {(invoice.items.length > 0 || invoice.tax > 0) && (
        <ul className="mt-3 space-y-1.5 border-b border-gray-100 pb-3 text-sm">
          {/* Advisors type the labels, so two rows can share one */}
          {invoice.items.map((item, index) => (
            <li key={index} className="flex justify-between gap-4">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
            </li>
          ))}
          {invoice.tax > 0 && (
            <li className="flex justify-between gap-4">
              <span className="text-gray-600">Tax ({Math.round(invoice.taxRate * 100)}%)</span>
              <span className="font-medium text-gray-900">{formatCurrency(invoice.tax)}</span>
            </li>
          )}
        </ul>
      )}

      <div className="flex justify-between pt-3 text-sm font-bold text-gray-900">
        <span>Total</span>
        <span>{formatCurrency(invoice.total)}</span>
      </div>
    </SectionCard>
  );
}
