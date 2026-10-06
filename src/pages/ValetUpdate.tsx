import { Navigate, useParams } from "react-router";
import { CheckCircle, Hourglass, UserCircle } from "reicon-react";
import { HoldToConfirm } from "@/components/ui/HoldToConfirm";
import { StateScreen } from "@/components/ui/StateScreen";
import { BookingError, WrongLink } from "@/components/features/staffPortal/shared/BookingError";
import { BookingHero } from "@/components/features/staffPortal/shared/BookingHero";
import { BookingSkeleton } from "@/components/features/staffPortal/shared/BookingSkeleton";
import { MilestoneTimeline, type Milestone } from "@/components/features/staffPortal/shared/MilestoneTimeline";
import { StatusChip } from "@/components/features/staffPortal/shared/StatusChip";
import { staffToast } from "@/components/features/staffPortal/shared/staffToast";
import { RouteCard } from "@/components/features/staffPortal/valet/RouteCard";
import {
  isValetLeg,
  tripRoute,
  tripTitles,
  valetActions,
} from "@/components/features/staffPortal/shared/workflow";
import {
  isComplete,
  nextMilestone,
  valetMilestoneLabels,
  valetTrip,
} from "@/components/features/admin/admin.utils";
import { formatTime } from "@/libs/utils";
import {
  useStaffBooking,
  useStaffValetProgress,
  type StaffLinkParams,
} from "@/services/queries/staffQueries";
import {
  ADVISOR_HANDOVER,
  LEG_MILESTONES,
  TRIP_END,
  type StaffBooking,
  type ValetLeg,
} from "@/types/admin";

// /valet/:leg/:bookingId/:token — the link the admin shares with the pickup or
// delivery valet (staffLink in admin.utils.ts). The token signs the valet in.
export function ValetUpdate() {
  const { leg, bookingId = "", token = "" } = useParams();
  const link: StaffLinkParams = { id: bookingId, token };
  const booking = useStaffBooking(link);

  if (!isValetLeg(leg)) return <Navigate to="/" replace />;
  if (booking.isPending) return <BookingSkeleton />;
  if (booking.isError) return <BookingError error={booking.error} onRetry={() => booking.refetch()} />;
  if (booking.data.linkRole && booking.data.linkRole !== leg) return <WrongLink />;

  return <ValetTrip booking={booking.data} leg={leg} link={link} />;
}

function ValetTrip({
  booking,
  leg,
  link,
}: {
  booking: StaffBooking;
  leg: ValetLeg;
  link: StaffLinkParams;
}) {
  const updateProgress = useStaffValetProgress();
  const { valet, progress } = valetTrip(booking, leg);
  const labels = valetMilestoneLabels[leg];
  const route = tripRoute(booking, leg);
  const complete = isComplete(booking);
  const next = valet && !complete ? nextMilestone(LEG_MILESTONES[leg], progress) : null;

  if (!valet) {
    return (
      <div className="page-body">
        <NotAssigned booking={booking} leg={leg} />
      </div>
    );
  }

  const milestones: Milestone[] = [
    { key: "assigned", label: "Valet assigned", done: true },
    ...LEG_MILESTONES[leg].map((key) => ({
      key,
      label: labels[key],
      done: !!progress[key],
      at: progress[key],
    })),
  ];

  // Until the valet arrives they head to the start; once they have the vehicle, to the end
  // (the delivery trip has no "arrived" update, so there it's until they pick it up)
  const atStart = LEG_MILESTONES[leg].includes("arrived") ? progress.arrived : progress.pickedUp;
  const heading = !next
    ? null
    : !atStart
      ? "from"
      : progress.pickedUp && !progress.reached
        ? "to"
        : null;

  const markNext = () => {
    if (!next) return;
    updateProgress.mutate(
      { ...link, leg, milestone: next },
      { onSuccess: () => staffToast.success(labels[next]) },
    );
  };

  return (
    <>
      <div className={next ? "page-body page-body-with-action" : "page-body pb-8"}>
        {/* First thing on the page: where the trip stands */}
        <section className="card">
          <p className="eyebrow mb-4">Trip progress</p>
          <MilestoneTimeline milestones={milestones} direction="horizontal" />
        </section>

        <BookingHero
          title={tripTitles[leg]}
          booking={booking}
          status={
            !next ? (
              <StatusChip tone="active">Done</StatusChip>
            ) : progress.dispatched ? (
              <StatusChip tone="active">On trip</StatusChip>
            ) : (
              <StatusChip tone="pending">Not started</StatusChip>
            )
          }
        />

        {/* Once the trip is over there's nowhere left to go, so the route goes too */}
        {next ? (
          <RouteCard from={route.from} to={route.to} heading={heading} />
        ) : (
          <TripDone booking={booking} leg={leg} deliveredAt={progress[TRIP_END[leg]]} />
        )}
      </div>

      {next && (
        <div className="action-bar">
          <div className="action-bar-inner">
            <HoldToConfirm
              key={next}
              label={valetActions[leg][next]}
              pending={updateProgress.isPending}
              onConfirm={markNext}
            />
          </div>
        </div>
      )}
    </>
  );
}

function TripDone({
  booking,
  leg,
  deliveredAt,
}: {
  booking: StaffBooking;
  leg: ValetLeg;
  deliveredAt?: string;
}) {
  return (
    <StateScreen tone="success" icon={<CheckCircle size={32} />} title="Trip complete">
      {leg === "pickup"
        ? `The vehicle arrived at ${booking.dealershipName}`
        : `The vehicle was delivered to ${booking.customer.name}`}
      {deliveredAt && ` at ${formatTime(deliveredAt)}`}. Thanks! Nothing else to do here.
    </StateScreen>
  );
}

// The link was opened before anyone was assigned to this trip
function NotAssigned({ booking, leg }: { booking: StaffBooking; leg: ValetLeg }) {
  if (isComplete(booking)) {
    return (
      <StateScreen tone="success" icon={<CheckCircle size={32} />} title="Service complete">
        Booking {booking.id} is finished. Nothing else to do here.
      </StateScreen>
    );
  }

  // The delivery trip can only start once the advisor marks the paid-up vehicle ready
  if (leg === "delivery" && !booking.advisorProgress?.[ADVISOR_HANDOVER]) {
    return (
      <StateScreen tone="pending" icon={<Hourglass size={30} />} title="Vehicle still in service">
        The vehicle is at {booking.dealershipName}. The delivery trip opens once the service is
        paid for and the advisor marks the vehicle ready to dispatch. This page updates by itself.
      </StateScreen>
    );
  }

  return (
    <StateScreen icon={<UserCircle size={30} />} title="No valet assigned yet">
      The Taverna team hasn't assigned the {tripTitles[leg].toLowerCase()} for booking {booking.id}{" "}
      yet. This page updates by itself.
    </StateScreen>
  );
}
