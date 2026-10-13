import { toast } from "sonner";
import { useAssignRelationshipManager, useConfirmBooking } from "@/services/queries/adminQueries";
import {
  journeyReached,
  SERVICE_INVOICED,
  SERVICE_JOURNEY,
  SERVICE_PAID,
  SERVICE_READY,
  type AdminBooking,
  type Invoice,
} from "@/types/admin";
import { formatCurrency, isComplete, staffLink } from "../admin.utils";
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
// the payment (unless the customer paid in the app) and marking the vehicle ready
// to dispatch. The delivery valet stays locked until the last one.
export function AdvisorStep({ booking, onDone }: AdvisorStepProps) {
  const assignAdvisor = useAssignRelationshipManager();
  // The API's one admin confirmation: it applies whichever the stage allows
  const confirm = useConfirmBooking();

  const advisor = booking.relationshipManager;
  const { journey, invoice } = booking;
  const reached = (key: string) => !!journey && journeyReached(journey, key);
  const paid = reached(SERVICE_PAID);
  const ready = reached(SERVICE_READY);
  const stepLabel = (key: string) => journey?.steps.find((step) => step.key === key)?.label;

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

      {invoice && <BillSummary invoice={invoice} paid={paid} />}

      {!advisor && (
        <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
          Select an advisor to continue...
        </p>
      )}

      {advisor && journey?.current === SERVICE_INVOICED && (
        <>
          <p className="text-xs text-gray-500">
            The customer can pay from their tracking page. Confirm here if they paid another way.
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
          actionLabel={isComplete(booking) ? undefined : "Next: Assign Delivery Valet"}
          onAction={onDone}
        />
      )}
    </div>
  );
}

// The bill as the customer sees it
function BillSummary({ invoice, paid }: { invoice: Invoice; paid: boolean }) {
  return (
    <SectionCard>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-900">Bill</h3>
        <span
          className={
            paid
              ? "rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-900"
              : "rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-status-pending"
          }
        >
          {paid ? "Paid" : "Awaiting payment"}
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
