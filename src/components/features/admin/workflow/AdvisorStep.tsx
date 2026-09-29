import { toast } from "sonner";
import {
  useAssignRelationshipManager,
  useConfirmPayment,
  useGenerateInvoice,
  useUpdateAdvisorProgress,
} from "@/services/queries/adminQueries";
import {
  ADVISOR_HANDOVER,
  ADVISOR_MILESTONES,
  type AdminBooking,
  type AdvisorMilestone,
  type Invoice,
} from "@/types/admin";
import {
  advisorMilestoneLabels,
  formatCurrency,
  formatDateTime,
  isComplete,
  nextMilestone,
  staffLink,
} from "../admin.utils";
import { MilestoneTracker, type Milestone } from "./MilestoneTracker";
import { ActionButton, AssignmentRow, SectionCard, StepDone } from "./StepParts";

interface AdvisorStepProps {
  booking: AdminBooking;
  onDone: () => void;
}

// The advisor is the customer's contact while the vehicle is at the dealership:
// assigned → inspecting → inspection done → service in progress → service done →
// invoice generated → payment confirmed → ready to dispatch. Each update shows up on
// the customer's tracking page; the delivery valet stays locked until the last one.
export function AdvisorStep({ booking, onDone }: AdvisorStepProps) {
  const assignAdvisor = useAssignRelationshipManager();
  const updateProgress = useUpdateAdvisorProgress();
  const generateInvoice = useGenerateInvoice();
  const confirmPayment = useConfirmPayment();

  const advisor = booking.relationshipManager;
  const progress = booking.advisorProgress ?? {};
  const { invoice, payment } = booking;
  const paid = payment?.status === "paid";
  const next = advisor ? nextMilestone(ADVISOR_MILESTONES, progress) : null;
  const ready = !!progress[ADVISOR_HANDOVER];

  const milestones: Milestone[] = [
    { key: "assigned", label: "Advisor assigned", done: !!advisor },
    ...ADVISOR_MILESTONES.map((key) => ({
      key,
      label: advisorMilestoneLabels[key],
      done: !!progress[key],
      at: progress[key],
    })),
    { key: "invoice", label: "Invoice generated", done: !!invoice, at: invoice?.issuedAt },
    { key: "paid", label: "Payment confirmed", done: paid, at: payment?.updatedAt },
    {
      key: ADVISOR_HANDOVER,
      label: advisorMilestoneLabels[ADVISOR_HANDOVER],
      done: ready,
      at: progress[ADVISOR_HANDOVER],
    },
  ];

  const mark = (milestone: AdvisorMilestone) =>
    updateProgress.mutate(
      { id: booking.id, milestone },
      {
        onSuccess: () =>
          toast.success(`${advisorMilestoneLabels[milestone]}: shared with the customer`),
      },
    );

  const sendBill = () =>
    generateInvoice.mutate(booking.id, {
      onSuccess: () => toast.success(`Invoice sent to ${booking.customer.name}`),
    });

  const markPaid = () =>
    confirmPayment.mutate(booking.id, {
      onSuccess: () => toast.success(`Payment confirmed for ${booking.id}`),
    });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        The customer's contact at the dealership. They share inspection and service updates,
        the invoice and the payment, then hand the vehicle over for delivery.
      </p>

      <AssignmentRow
        role="manager"
        label="Advisor assigned"
        assigned={advisor}
        link={staffLink(booking.id, "advisor")}
        saving={assignAdvisor.isPending}
        lockedReason={
          isComplete(booking) ? "The service is complete, so the advisor can't be changed." : undefined
        }
        onAssign={(member) =>
          assignAdvisor.mutate(
            { id: booking.id, managerId: member.id },
            { onSuccess: () => toast.success(`${member.name} assigned as advisor`) },
          )
        }
      />

      <SectionCard>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-900">Service progress</h3>
          <p className="text-xs text-gray-500">Each update is shared with the customer.</p>
        </div>

        <MilestoneTracker milestones={milestones} />
      </SectionCard>

      {invoice && <BillSummary invoice={invoice} paid={paid} />}

      {!advisor && (
        <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
          Assign an advisor once the vehicle is at the dealership.
        </p>
      )}

      {next && (
        <ActionButton pending={updateProgress.isPending} onClick={() => mark(next)}>
          Share “{advisorMilestoneLabels[next]}”
        </ActionButton>
      )}

      {advisor && !next && !invoice && (
        <ActionButton
          pending={generateInvoice.isPending}
          pendingLabel="Sending..."
          onClick={sendBill}
        >
          Generate & Send Invoice
        </ActionButton>
      )}

      {invoice && !paid && (
        <>
          <p className="text-xs text-gray-500">
            The customer can pay from their tracking page. Confirm here if they paid another way.
          </p>
          <ActionButton
            pending={confirmPayment.isPending}
            pendingLabel="Confirming..."
            onClick={markPaid}
          >
            Confirm Payment Received
          </ActionButton>
        </>
      )}

      {paid && payment && !ready && (
        <>
          <p className="text-xs text-gray-500">
            {formatCurrency(payment.amount)} paid on {formatDateTime(payment.updatedAt)}. Mark
            the vehicle ready once it's handed back to the dealership for delivery.
          </p>
          <ActionButton
            pending={updateProgress.isPending}
            onClick={() => mark(ADVISOR_HANDOVER)}
          >
            Mark “Vehicle ready to dispatch”
          </ActionButton>
        </>
      )}

      {ready && (
        <StepDone
          text={`Vehicle ready to dispatch since ${formatDateTime(progress[ADVISOR_HANDOVER] ?? null)}`}
          actionLabel={isComplete(booking) ? undefined : "Next: Assign delivery valet"}
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
              ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
              : "rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-status-pending"
          }
        >
          {paid ? "Paid" : "Awaiting payment"}
        </span>
      </div>

      <ul className="mt-3 space-y-1.5 border-b border-gray-100 pb-3 text-sm">
        {invoice.items.map((item) => (
          <li key={item.label} className="flex justify-between gap-4">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
          </li>
        ))}
        <li className="flex justify-between gap-4">
          <span className="text-gray-600">Tax ({Math.round(invoice.taxRate * 100)}%)</span>
          <span className="font-medium text-gray-900">{formatCurrency(invoice.tax)}</span>
        </li>
      </ul>

      <div className="flex justify-between pt-3 text-sm font-bold text-gray-900">
        <span>Total</span>
        <span>{formatCurrency(invoice.total)}</span>
      </div>
    </SectionCard>
  );
}
