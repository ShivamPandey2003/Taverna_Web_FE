import { useState } from "react";
import { useParams } from "react-router";
import { CheckCircle, Driving, UserCircle } from "reicon-react";
import { HoldToConfirm } from "@/components/ui/HoldToConfirm";
import { StateScreen } from "@/components/ui/StateScreen";
import { billItems, newBillLine } from "@/components/features/staffPortal/advisor/bill";
import { BillCard } from "@/components/features/staffPortal/advisor/BillCard";
import { BillForm } from "@/components/features/staffPortal/advisor/BillForm";
import { BookingError, WrongLink } from "@/components/features/staffPortal/shared/BookingError";
import { BookingHero } from "@/components/features/staffPortal/shared/BookingHero";
import { BookingSkeleton } from "@/components/features/staffPortal/shared/BookingSkeleton";
import { CustomerCard } from "@/components/features/staffPortal/shared/CustomerCard";
import { MilestoneTimeline, type Milestone } from "@/components/features/staffPortal/shared/MilestoneTimeline";
import { StatusChip } from "@/components/features/staffPortal/shared/StatusChip";
import { staffToast } from "@/components/features/staffPortal/shared/staffToast";
import { advisorActions } from "@/components/features/staffPortal/shared/workflow";
import {
  advisorMilestoneLabels,
  isComplete,
  nextMilestone,
  valetMilestoneLabels,
  valetTrip,
} from "@/components/features/admin/admin.utils";
import { firstName, formatTime } from "@/libs/utils";
import {
  useStaffAdvisorProgress,
  useStaffBooking,
  useStaffConfirmPayment,
  useStaffGenerateInvoice,
  type StaffLinkParams,
} from "@/services/queries/staffQueries";
import {
  ADVISOR_HANDOVER,
  ADVISOR_MILESTONES,
  VALET_MILESTONES,
  type StaffBooking,
} from "@/types/admin";

// /advisor/:bookingId/:token — the link the admin shares with the booking's advisor
// (staffLink in admin.utils.ts). The token signs the advisor in.
export function AdvisorUpdate() {
  const { bookingId = "", token = "" } = useParams();
  const link: StaffLinkParams = { id: bookingId, token };
  const booking = useStaffBooking(link);

  if (booking.isPending) return <BookingSkeleton />;
  if (booking.isError) return <BookingError error={booking.error} onRetry={() => booking.refetch()} />;
  if (booking.data.linkRole && booking.data.linkRole !== "advisor") return <WrongLink />;

  return <AdvisorService booking={booking.data} link={link} />;
}

// Inspecting → inspection done → service in progress → service done, then fill in and
// generate the invoice; once it's paid (in the customer's app, or confirmed here by the
// advisor), mark the vehicle ready to dispatch. Every update shows up on the customer's tracking page.
function AdvisorService({ booking, link }: { booking: StaffBooking; link: StaffLinkParams }) {
  const updateProgress = useStaffAdvisorProgress();
  const generateInvoice = useStaffGenerateInvoice();
  const confirmPayment = useStaffConfirmPayment();
  const [billLines, setBillLines] = useState(() => [newBillLine()]);

  const advisor = booking.relationshipManager;
  const progress = booking.advisorProgress ?? {};
  const { invoice, payment } = booking;
  const paid = payment?.status === "paid";
  const complete = isComplete(booking);
  const ready = !!progress[ADVISOR_HANDOVER];
  const serviceStep = advisor && !complete ? nextMilestone(ADVISOR_MILESTONES, progress) : null;
  const canGenerateBill = !!advisor && !complete && !serviceStep && !invoice;
  // The hold button's milestone: the next service update, or the handover once it's paid
  const next = serviceStep ?? (advisor && !complete && paid && !ready ? ADVISOR_HANDOVER : null);
  // null until every row the advisor started has an item and a price
  const billReady = billItems(billLines);
  const customer = firstName(booking.customer.name);

  if (!advisor) {
    return (
      <div className="page-body">
        <NotAssigned booking={booking} />
      </div>
    );
  }

  const milestones: Milestone[] = [
    { key: "assigned", label: "Advisor assigned", done: true },
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
  // The customer can pay in the app; the advisor confirms here if they paid another way
  const canConfirmPayment = !complete && !!invoice && !paid;
  const hasAction = !!next || canGenerateBill || canConfirmPayment;

  const markNext = () => {
    if (!next) return;
    updateProgress.mutate(
      { ...link, milestone: next },
      {
        onSuccess: () =>
          staffToast.success(`${advisorMilestoneLabels[next]}: shared with ${customer}`),
      },
    );
  };

  const generateBill = () => {
    if (!billReady) return;
    generateInvoice.mutate(
      { ...link, items: billReady },
      { onSuccess: () => staffToast.success(`Invoice generated and sent to ${customer}`) },
    );
  };

  const markPaid = () =>
    confirmPayment.mutate(link, {
      onSuccess: () => staffToast.success(`Payment confirmed for ${booking.id}`),
    });

  return (
    <>
      <div className={hasAction ? "page-body page-body-with-action" : "page-body pb-8"}>
        <BookingHero
          title="Service updates"
          booking={booking}
          status={
            ready || complete ? (
              <StatusChip tone="active">Done</StatusChip>
            ) : paid ? (
              <StatusChip tone="pending">To dispatch</StatusChip>
            ) : invoice ? (
              <StatusChip tone="pending">Awaiting payment</StatusChip>
            ) : progress.serviceDone ? (
              <StatusChip tone="pending">Invoice to generate</StatusChip>
            ) : progress.inService ? (
              <StatusChip tone="active">In service</StatusChip>
            ) : progress.inspected ? (
              <StatusChip tone="active">Inspection done</StatusChip>
            ) : progress.inspecting ? (
              <StatusChip tone="active">Inspecting</StatusChip>
            ) : (
              <StatusChip tone="pending">Not started</StatusChip>
            )
          }
        />

        {(ready || complete) && payment && <PaidSummary booking={booking} paidAt={payment.updatedAt} />}

        {canGenerateBill && (
          <BillForm lines={billLines} onChange={setBillLines} disabled={generateInvoice.isPending} />
        )}

        {invoice && <BillCard invoice={invoice} paid={paid} />}

        <CustomerCard customer={booking.customer} />

        <section className="card">
          <p className="eyebrow mb-4">Service progress</p>
          <MilestoneTimeline milestones={milestones} />
        </section>
      </div>

      {hasAction && (
        <div className="action-bar">
          <div className="action-bar-inner">
            {next ? (
              <HoldToConfirm
                key={next}
                label={advisorActions[next]}
                pending={updateProgress.isPending}
                onConfirm={markNext}
              />
            ) : canConfirmPayment ? (
              <HoldToConfirm
                key="paid"
                label="Confirm payment received"
                pendingLabel="Confirming..."
                pending={confirmPayment.isPending}
                onConfirm={markPaid}
              />
            ) : (
              <HoldToConfirm
                key="bill"
                label="Generate invoice"
                pendingLabel="Generating..."
                pending={generateInvoice.isPending}
                disabled={!billReady}
                onConfirm={generateBill}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

// After the handover: the advisor's part is over; show how the vehicle's return is going
function PaidSummary({ booking, paidAt }: { booking: StaffBooking; paidAt: string }) {
  const { valet, progress } = valetTrip(booking, "delivery");
  const reached = [...VALET_MILESTONES].reverse().find((key) => progress[key]);

  return (
    <StateScreen
      tone="success"
      icon={<CheckCircle size={32} />}
      title={isComplete(booking) ? "Service complete" : "All done on your side"}
    >
      Paid {formatTime(paidAt)}.{" "}
      {isComplete(booking)
        ? "The vehicle is back with the customer."
        : valet
          ? `${valet.name} is bringing the vehicle back${reached ? `: ${valetMilestoneLabels.delivery[reached].toLowerCase()}` : ""}.`
          : "The Taverna team is booking the delivery valet."}
    </StateScreen>
  );
}

function NotAssigned({ booking }: { booking: StaffBooking }) {
  if (isComplete(booking)) {
    return (
      <StateScreen tone="success" icon={<CheckCircle size={32} />} title="Service complete">
        Booking {booking.id} is finished. Nothing else to do here.
      </StateScreen>
    );
  }

  // Advisors are assigned once the vehicle reaches the dealership
  const { valet, progress } = valetTrip(booking, "pickup");
  if (!progress.delivered) {
    const reached = [...VALET_MILESTONES].reverse().find((key) => progress[key]);
    return (
      <StateScreen tone="pending" icon={<Driving size={30} />} title="Vehicle on its way">
        {valet
          ? `${valet.name} is bringing the ${booking.vehicle.model} to ${booking.dealershipName}${reached ? ` (${valetMilestoneLabels.pickup[reached].toLowerCase()})` : ""}.`
          : `The ${booking.vehicle.model} hasn't been collected yet.`}{" "}
        The service opens here once it arrives and you're assigned.
      </StateScreen>
    );
  }

  return (
    <StateScreen icon={<UserCircle size={30} />} title="No advisor assigned yet">
      The vehicle is at {booking.dealershipName}. The Taverna team hasn't assigned an advisor for
      booking {booking.id} yet. This page updates by itself.
    </StateScreen>
  );
}
