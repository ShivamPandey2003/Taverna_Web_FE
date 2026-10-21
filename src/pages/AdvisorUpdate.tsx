import { useState } from "react";
import { useParams } from "react-router";
import { CheckCircle } from "reicon-react";
import { HoldToConfirm } from "@/components/ui/HoldToConfirm";
import { StateScreen } from "@/components/ui/StateScreen";
import { billItems, newBillLine } from "@/components/features/staffPortal/advisor/bill";
import { BillCard } from "@/components/features/staffPortal/advisor/BillCard";
import { BillForm } from "@/components/features/staffPortal/advisor/BillForm";
import { BookingError } from "@/components/features/staffPortal/shared/BookingError";
import { BookingHero } from "@/components/features/staffPortal/shared/BookingHero";
import { BookingSkeleton } from "@/components/features/staffPortal/shared/BookingSkeleton";
import { MilestoneTimeline } from "@/components/features/staffPortal/shared/MilestoneTimeline";
import { StaffLogin } from "@/components/features/staffPortal/shared/StaffLogin";
import { StatusChip } from "@/components/features/staffPortal/shared/StatusChip";
import { staffToast } from "@/components/features/staffPortal/shared/staffToast";
import { useStaffAuth } from "@/components/features/staffPortal/shared/useStaffAuth";
import { firstName } from "@/libs/utils";
import {
  useAdvanceAdvisorService,
  useAdvisorService,
  type StaffLinkParams,
} from "@/services/queries/staffQueries";
import type { AdvisorServiceDetails } from "@/types/admin";

// /advisor/:bookingId — a booking's service, for its signed-in advisor, opened
// from their task list. Without a sign-in the advisor signs in with email + OTP first.
export function AdvisorUpdate() {
  const { bookingId = "" } = useParams();
  const { auth, signedIn, signOut } = useStaffAuth();
  const link: StaffLinkParams = { id: bookingId, ...auth };
  const service = useAdvisorService(link);

  if (!signedIn) return <StaffLogin type="advisor" />;
  if (service.isPending) return <BookingSkeleton />;
  if (service.isError) {
    return (
      <BookingError error={service.error} onRetry={() => service.refetch()} onSignIn={signOut} />
    );
  }

  return <AdvisorService service={service.data} link={link} />;
}

// The advisor moves the service on a step at a time, then fills in and generates
// the invoice, which ends their part: the payment and the handover for delivery
// are the admin's. Every update shows up on the customer's tracking page.
function AdvisorService({
  service,
  link,
}: {
  service: AdvisorServiceDetails;
  link: StaffLinkParams;
}) {
  const advance = useAdvanceAdvisorService();
  const [billLines, setBillLines] = useState(() => [newBillLine()]);

  const { steps, nextAction, canGenerateInvoice, invoice } = service;
  // null until every row the advisor started has an item and a price
  const billReady = billItems(billLines);
  const customer = firstName(service.customer.name);
  const started = steps.filter((step) => step.done).length > 1;
  const hasAction = !!nextAction || canGenerateInvoice;

  const markNext = () =>
    advance.mutate(link, {
      onSuccess: (updated) => staffToast.success(`${updated.label}: shared with ${customer}`),
    });

  const generateBill = () => {
    if (!billReady) return;
    advance.mutate(
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
          <MilestoneTimeline milestones={steps} direction="horizontal" />
        </section>

        <BookingHero
          title="Service Updates"
          booking={service}
          columns
          when={{ label: "Booking date", value: service.bookingDate }}
          status={<StatusChip tone={started ? "active" : "pending"}>{service.status}</StatusChip>}
        />

        {/* Once the invoice is out the advisor's part is over */}
        {invoice && !hasAction && (
          <StateScreen tone="success" icon={<CheckCircle size={32} />} title="All Done on Your Side">
            The invoice will be sent to {customer}, and the Taverna team will handle it from there.
          </StateScreen>
        )}

        {canGenerateInvoice && (
          <BillForm lines={billLines} onChange={setBillLines} disabled={advance.isPending} />
        )}

        {invoice && <BillCard invoice={invoice} />}
      </div>

      {hasAction && (
        <div className="action-bar">
          <div className="action-bar-inner">
            {canGenerateInvoice ? (
              <HoldToConfirm
                key="bill"
                label="Generate Invoice"
                pendingLabel="Generating..."
                pending={advance.isPending}
                disabled={!billReady}
                onConfirm={generateBill}
              />
            ) : (
              nextAction && (
                <HoldToConfirm
                  key={nextAction.status}
                  label={nextAction.label}
                  pending={advance.isPending}
                  onConfirm={markNext}
                />
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}
