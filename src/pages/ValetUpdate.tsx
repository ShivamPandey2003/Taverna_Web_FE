import { Navigate, useParams } from "react-router";
import { CheckCircle } from "reicon-react";
import { HoldToConfirm } from "@/components/ui/HoldToConfirm";
import { StateScreen } from "@/components/ui/StateScreen";
import { BookingError } from "@/components/features/staffPortal/shared/BookingError";
import { BookingHero } from "@/components/features/staffPortal/shared/BookingHero";
import { BookingSkeleton } from "@/components/features/staffPortal/shared/BookingSkeleton";
import { MilestoneTimeline } from "@/components/features/staffPortal/shared/MilestoneTimeline";
import { StaffLogin } from "@/components/features/staffPortal/shared/StaffLogin";
import { StatusChip } from "@/components/features/staffPortal/shared/StatusChip";
import { staffToast } from "@/components/features/staffPortal/shared/staffToast";
import { taskPath } from "@/components/features/staffPortal/shared/tasks";
import { useStaffAuth } from "@/components/features/staffPortal/shared/useStaffAuth";
import { RouteCard } from "@/components/features/staffPortal/valet/RouteCard";
import { isValetLeg } from "@/components/features/staffPortal/shared/workflow";
import { formatTime } from "@/libs/utils";
import {
  useAdvanceValetTrip,
  useValetTrip,
  type StaffLinkParams,
} from "@/services/queries/staffQueries";
import type { ValetTripDetails } from "@/types/admin";

// /valet/:leg/:bookingId — a trip of the signed-in valet, opened from their task
// list. Without a sign-in the valet signs in with email + OTP first.
export function ValetUpdate() {
  const { leg, bookingId = "" } = useParams();
  const { auth, signedIn, signOut } = useStaffAuth();
  const link: StaffLinkParams = { id: bookingId, ...auth };
  const trip = useValetTrip(link);

  if (!isValetLeg(leg)) return <Navigate to="/" replace />;
  if (!signedIn) return <StaffLogin type="valet" />;
  if (trip.isPending) return <BookingSkeleton />;
  if (trip.isError) {
    return <BookingError error={trip.error} onRetry={() => trip.refetch()} onSignIn={signOut} />;
  }
  // The API says which trip of the booking this valet has
  if (trip.data.leg !== leg) return <Navigate to={taskPath(trip.data.leg, bookingId)} replace />;

  return <ValetTrip trip={trip.data} link={link} />;
}

function ValetTrip({ trip, link }: { trip: ValetTripDetails; link: StaffLinkParams }) {
  const advance = useAdvanceValetTrip();
  const { steps, nextAction } = trip;
  const started = steps.some((step) => step.done);
  const last = steps.at(-1);
  const done = !!last?.done;

  // Until the valet has the vehicle they head to the start, then to the end
  const pickedUp = steps.find((step) => /pickedup/i.test(step.key));
  const heading = !nextAction || done ? null : pickedUp?.done ? "to" : "from";

  const markNext = () =>
    advance.mutate(link, { onSuccess: (updated) => staffToast.success(updated.label) });

  return (
    <>
      <div className={nextAction ? "page-body page-body-with-action" : "page-body pb-8"}>
        {/* First thing on the page: where the trip stands */}
        <section className="card">
          <p className="eyebrow mb-4">{trip.leg === "pickup" ? "PICKUP" : "DELIVERY"} PROGRESS</p>
          <MilestoneTimeline milestones={steps} direction="horizontal" />
        </section>

        <BookingHero
          title={trip.title}
          booking={trip}
          when={{
            label: trip.leg === "pickup" ? "Scheduled pickup" : "Scheduled delivery",
            value: trip.scheduled,
          }}
          status={<StatusChip tone={started ? "active" : "pending"}>{trip.status}</StatusChip>}
        />

        {/* Once the trip is over there's nowhere left to go, so the route goes too */}
        {done ? (
          <StateScreen tone="success" icon={<CheckCircle size={32} />} title="Trip Complete">
            {trip.leg === "pickup"
              ? `The vehicle arrived at ${trip.to.label}`
              : `The vehicle was delivered to ${trip.to.label}`}
            {last?.at && ` at ${formatTime(last.at)}`}. Thanks!
          </StateScreen>
        ) : (
          <RouteCard from={trip.from} to={trip.to} heading={heading} />
        )}
      </div>

      {nextAction && (
        <div className="action-bar">
          <div className="action-bar-inner">
            <HoldToConfirm
              key={nextAction.status}
              label={nextAction.label}
              pending={advance.isPending}
              onConfirm={markNext}
            />
          </div>
        </div>
      )}
    </>
  );
}
