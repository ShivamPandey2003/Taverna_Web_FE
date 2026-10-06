import { toast } from "sonner";
import { useAssignValet, useUpdateValetProgress } from "@/services/queries/adminQueries";
import {
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

const legDescriptions: Record<ValetLeg, string> = {
  pickup: "Collects the vehicle from the customer and drives it to the dealership.",
  delivery: "Collects the serviced vehicle from the dealership and returns it to the customer.",
};

const nextStepLabels: Record<ValetLeg, string> = {
  pickup: "Next: Assign Advisor",
  delivery: "Next: Complete Service",
};

// Assign a valet, share their link, and follow the trip milestone by milestone.
// The next workflow step stays locked until the vehicle reaches the other end.
export function ValetStep({ booking, leg, onDone }: ValetStepProps) {
  const assignValet = useAssignValet();
  const updateProgress = useUpdateValetProgress();

  const { valet, progress } = valetTrip(booking, leg);
  const labels = valetMilestoneLabels[leg];
  const next = valet ? nextMilestone(LEG_MILESTONES[leg], progress) : null;
  const finished = !!valet && !next;

  const complete = isComplete(booking);

  const lockedReason = complete
    ? "The service is complete, so the valet can't be changed."
    : progress.pickedUp
      ? "The valet already has the vehicle, so they can't be changed."
      : undefined;

  const milestones: Milestone[] = [
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

  const markNext = () => {
    if (!next) return;
    updateProgress.mutate(
      { id: booking.id, leg, milestone: next },
      { onSuccess: () => toast.success(labels[next]) },
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{legDescriptions[leg]}</p>

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

      {finished && (
        <StepDone
          text={labels[TRIP_END[leg]]}
          actionLabel={complete ? undefined : nextStepLabels[leg]}
          onAction={onDone}
        />
      )}
    </div>
  );
}
