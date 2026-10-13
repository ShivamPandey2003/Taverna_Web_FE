import { toast } from "sonner";
import {
  useAssignValet,
  useConfirmBooking,
  useUpdateValetProgress,
} from "@/services/queries/adminQueries";
import {
  INTAKE_ARRIVED,
  INTAKE_CONFIRMED,
  INTAKE_JOURNEY,
  journeyReached,
  LEG_MILESTONES,
  TRIP_END,
  type AdminBooking,
  type StaffMember,
  type ValetLeg,
} from "@/types/admin";
import {
  isComplete,
  legTitles,
  nextMilestone,
  staffLink,
  valetMilestoneLabels,
  valetTrip,
} from "../admin.utils";
import { MilestoneTracker, type Milestone } from "./MilestoneTracker";
import { ActionButton, AssignmentRow, SectionCard, StepDone } from "./StepParts";

interface ValetStepProps {
  booking: AdminBooking;
  leg: ValetLeg;
  onDone: () => void;
}

const nextStepLabels: Record<ValetLeg, string> = {
  pickup: "Next: Assign Advisor",
  delivery: "Next: Complete Service",
};

// Assign a valet, share their link, and follow the trip milestone by milestone.
// The next workflow step stays locked until the vehicle reaches the other end.
// The pickup trip is the real API's (`booking.journey`): the valet posts its steps
// from their own page, so the admin only watches, and then confirms the vehicle
// was received at the dealership. The delivery trip is still marked here.
export function ValetStep({ booking, leg, onDone }: ValetStepProps) {
  const assignValet = useAssignValet();
  const updateProgress = useUpdateValetProgress();

  const { valet, progress } = valetTrip(booking, leg);
  const labels = valetMilestoneLabels[leg];
  const confirmReceived = useConfirmBooking();
  const journey = leg === "pickup" ? booking.journey : undefined;
  const next = valet && !journey ? nextMilestone(LEG_MILESTONES[leg], progress) : null;
  // The valet's trip is over and the vehicle waits for the admin to confirm it
  const awaitingReceipt = !!valet && journey?.current === INTAKE_ARRIVED;
  const finished = journey ? journeyReached(journey, INTAKE_CONFIRMED) : !!valet && !next;
  const stepLabel = (key: string) => journey?.steps.find((step) => step.key === key)?.label;

  const complete = isComplete(booking);

  const lockedReason = complete
    ? "The service is complete, so the valet can't be changed."
    : progress.pickedUp
      ? "The valet already has the vehicle, so they can't be changed."
      : undefined;

  const milestones: Milestone[] = journey
    ? // The API only says when the current step was reached
      INTAKE_JOURNEY.flatMap((key) => {
        const label = stepLabel(key);
        if (!label) return [];
        return [
          {
            key,
            label,
            done: journeyReached(journey, key),
            at: key === journey.current ? (journey.doneAt ?? undefined) : undefined,
          },
        ];
      })
    : [
        { key: "assigned", label: "Valet Assigned", done: !!valet, at: booking.assignedAt?.[leg] },
        ...LEG_MILESTONES[leg].map((key) => ({
          key,
          label: labels[key],
          done: !!progress[key],
          at: progress[key],
        })),
      ];

  const assign = (member: StaffMember, done: () => void) =>
    assignValet.mutate(
      { id: booking.id, leg, valetId: member.id },
      {
        onSuccess: () => {
          toast.success(`${member.name} assigned as ${legTitles[leg].toLowerCase()}`);
          done();
        },
      },
    );

  const markReceived = () =>
    confirmReceived.mutate(booking.id, {
      onSuccess: () => toast.success("Vehicle received at the dealership"),
    });

  const markNext = () => {
    if (!next) return;
    updateProgress.mutate(
      { id: booking.id, leg, milestone: next },
      { onSuccess: () => toast.success(labels[next]) },
    );
  };

  return (
    <div className="space-y-4">
      <AssignmentRow
        role="valet"
        title={legTitles[leg]}
        booking={booking}
        assigned={valet}
        link={staffLink(booking, leg)}
        saving={assignValet.isPending}
        lockedReason={lockedReason}
        // Swapping a valet who's already on the way restarts the trip
        changeWarning={
          progress.dispatched
            ? `${valet?.name} is already on the way. Changing the valet starts this trip over from "Valet Assigned".`
            : undefined
        }
        onAssign={assign}
      />

      {/* There's no trip to follow until a valet is assigned */}
      {valet && (
        <SectionCard>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-gray-900">Trip Progress</h3>
            <p className="text-xs text-gray-500">
              {/* {complete
                ? "Posted by the valet from their link."
                : "The valet posts these from their link. You can also mark them here."} */}
            </p>
          </div>

          <MilestoneTracker milestones={milestones} />
        </SectionCard>
      )}

      {!valet && (
        <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
          Assign a valet to start the trip.
        </p>
      )}

      {next && (
        <ActionButton pending={updateProgress.isPending} onClick={markNext}>
          Mark “{labels[next]}”
        </ActionButton>
      )}

      {awaitingReceipt && (
        <ActionButton pending={confirmReceived.isPending} onClick={markReceived}>
          Confirm Vehicle Received
        </ActionButton>
      )}

      {finished && (
        <StepDone
          text={stepLabel(INTAKE_CONFIRMED) ?? labels[TRIP_END[leg]]}
          actionLabel={complete ? undefined : nextStepLabels[leg]}
          onAction={onDone}
        />
      )}
    </div>
  );
}
