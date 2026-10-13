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
import { MilestoneTimeline, type Milestone } from "@/components/features/staffPortal/shared/MilestoneTimeline";
import { StaffLogin } from "@/components/features/staffPortal/shared/StaffLogin";
import { StatusChip } from "@/components/features/staffPortal/shared/StatusChip";
import { staffToast } from "@/components/features/staffPortal/shared/staffToast";
import { useStaffAuth } from "@/components/features/staffPortal/shared/useStaffAuth";
import { advisorActions } from "@/components/features/staffPortal/shared/workflow";
import {
  advisorMilestoneLabels,
  isComplete,
  nextMilestone,
  valetMilestoneLabels,
  valetTrip,
} from "@/components/features/admin/admin.utils";
import { firstName, formatPickupTime, formatTime } from "@/libs/utils";
import {
  useStaffAdvisorProgress,
  useStaffBooking,
  useStaffGenerateInvoice,
  type StaffLinkParams,
} from "@/services/queries/staffQueries";
import {
  ADVISOR_HANDOVER,
  ADVISOR_MILESTONES,
  VALET_MILESTONES,
  type StaffBooking,
} from "@/types/admin";

// /advisor/:bookingId?gear=…&token=… — the link the admin shares with the
// booking's advisor (staffLink in admin.utils.ts). The search params sign the
// advisor in; without them the advisor signs in with email + OTP first.
export function AdvisorUpdate() {
  const { bookingId = "" } = useParams();
  const { auth, signedIn, signOut } = useStaffAuth();
  const link: StaffLinkParams = { id: bookingId, ...auth };
  const booking = useStaffBooking(link);

  if (!signedIn) return <StaffLogin type="advisor" />;
  if (booking.isPending) return <BookingSkeleton />;
  if (booking.isError) {
    return (
      <BookingError error={booking.error} onRetry={() => booking.refetch()} onSignIn={signOut} />
    );
  }
  if (booking.data.linkRoles && !booking.data.linkRoles.includes("advisor")) {
    return <WrongLink onSignIn={signOut} />;
  }

  return <AdvisorService booking={booking.data} link={link} />;
}

// Inspecting → service in progress, then fill in and
// generate the invoice, which ends the advisor's part: the payment and the handover
// for delivery are the admin's. Every update shows up on the customer's tracking page.
function AdvisorService({ booking, link }: { booking: StaffBooking; link: StaffLinkParams }) {
  const updateProgress = useStaffAdvisorProgress();
  const generateInvoice = useStaffGenerateInvoice();
  const [billLines, setBillLines] = useState(() => [newBillLine()]);

  const advisor = booking.relationshipManager;
  const progress = booking.advisorProgress ?? {};
  const { invoice, payment } = booking;
  const paid = payment?.status === "paid";
  const complete = isComplete(booking);
  const ready = !!progress[ADVISOR_HANDOVER];
  const serviceStep = advisor && !complete ? nextMilestone(ADVISOR_MILESTONES, progress) : null;
  const canGenerateBill = !!advisor && !complete && !serviceStep && !invoice;
  // The hold button's milestone
  const next = serviceStep;
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
    // "Advisor assigned" on the admin side; here the advisor reads it as their own job
    { key: "assigned", label: "Vehicle Assigned", done: true, at: booking.assignedAt?.advisor },
    ...ADVISOR_MILESTONES.map((key) => ({
      key,
      label: advisorMilestoneLabels[key],
      done: !!progress[key],
      at: progress[key],
    })),
    { key: "invoice", label: "Invoice Generated", done: !!invoice, at: invoice?.issuedAt },
  ];
  const hasAction = !!next || canGenerateBill;

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

  return (
    <>
      <div className={hasAction ? "page-body page-body-with-action" : "page-body pb-8"}>
        {/* First thing on the page: where the service stands */}
        <section className="card">
          <p className="eyebrow mb-4">Service progress</p>
          <MilestoneTimeline milestones={milestones} direction="horizontal" />
        </section>

        <BookingHero
          title="Service Updates"
          booking={booking}
          columns
          when={{ label: "Booking date", value: formatPickupTime(booking.createdAt) }}
          status={
            ready || complete ? (
              <StatusChip tone="active">Done</StatusChip>
            ) : paid ? (
              <StatusChip tone="active">Paid</StatusChip>
            ) : invoice ? (
              <StatusChip tone="pending">Awaiting payment</StatusChip>
            ) : progress.inService ? (
              <StatusChip tone="active">In service</StatusChip>
            ) : progress.inspecting ? (
              <StatusChip tone="active">Inspecting</StatusChip>
            ) : (
              <StatusChip tone="pending">Not started</StatusChip>
            )
          }
        />

        {(invoice || complete) && (
          <DoneSummary
            booking={booking}
            paidAt={paid ? payment?.updatedAt : undefined}
            ready={ready}
          />
        )}

        {canGenerateBill && (
          <BillForm lines={billLines} onChange={setBillLines} disabled={generateInvoice.isPending} />
        )}

        {invoice && <BillCard invoice={invoice} paid={paid} />}

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
            ) : (
              <HoldToConfirm
                key="bill"
                label="Generate Invoice"
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

// Once the invoice is out the advisor's part is over; show how the rest is going
function DoneSummary({
  booking,
  paidAt,
  ready,
}: {
  booking: StaffBooking;
  // When the invoice was paid, if it has been
  paidAt?: string;
  // The admin has marked the vehicle ready to dispatch
  ready: boolean;
}) {
  const { valet, progress } = valetTrip(booking, "delivery");
  const reached = [...VALET_MILESTONES].reverse().find((key) => progress[key]);

  return (
    <StateScreen
      tone="success"
      icon={<CheckCircle size={32} />}
      title={isComplete(booking) ? "Service Complete" : "All Done on Your Side"}
    >
      {paidAt && `Paid ${formatTime(paidAt)}. `}
      {isComplete(booking)
        ? "The vehicle is back with the customer."
        : !paidAt
          ? `The invoice is with ${firstName(booking.customer.name)}. The Taverna team confirms the payment and sends the vehicle back.`
          : !ready
            ? "The Taverna team is getting the vehicle ready to dispatch."
            : valet
              ? `${valet.name} is bringing the vehicle back${reached ? `: ${valetMilestoneLabels.delivery[reached].toLowerCase()}` : ""}.`
              : "The Taverna team is booking the delivery valet."}
    </StateScreen>
  );
}

function NotAssigned({ booking }: { booking: StaffBooking }) {
  if (isComplete(booking)) {
    return (
      <StateScreen tone="success" icon={<CheckCircle size={32} />} title="Service Complete">
        Booking {booking.id} is finished. Nothing else to do here.
      </StateScreen>
    );
  }

  // Advisors are assigned once the vehicle reaches the dealership
  const { valet, progress } = valetTrip(booking, "pickup");
  if (!progress.reached) {
    const reached = [...VALET_MILESTONES].reverse().find((key) => progress[key]);
    return (
      <StateScreen tone="pending" icon={<Driving size={30} />} title="Vehicle on Its Way">
        {valet
          ? `${valet.name} is bringing the ${booking.vehicle.model} to ${booking.dealershipName}${reached ? ` (${valetMilestoneLabels.pickup[reached].toLowerCase()})` : ""}.`
          : `The ${booking.vehicle.model} hasn't been collected yet.`}{" "}
        The service opens here once it arrives and you're assigned.
      </StateScreen>
    );
  }

  return (
    <StateScreen icon={<UserCircle size={30} />} title="No Advisor Assigned Yet">
      The vehicle is at {booking.dealershipName}. The Taverna team hasn't assigned an advisor for
      booking {booking.id} yet. This page updates by itself.
    </StateScreen>
  );
}
