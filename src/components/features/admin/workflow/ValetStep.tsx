import { useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAssignValet, useUpdateValetProgress } from "@/services/queries/adminQueries";
import { VALET_MILESTONES, type AdminBooking, type StaffMember, type ValetLeg } from "@/types/admin";
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
  pickup: "Next: Assign advisor",
  delivery: "Next: Complete service",
};

// Assign a valet, share their link, and follow the trip milestone by milestone.
// The next workflow step stays locked until the vehicle is handed over.
export function ValetStep({ booking, leg, onDone }: ValetStepProps) {
  const assignValet = useAssignValet();
  const updateProgress = useUpdateValetProgress();
  // Replacement waiting for confirmation, because it restarts the trip
  const [replacement, setReplacement] = useState<StaffMember | null>(null);

  const { valet, progress } = valetTrip(booking, leg);
  const labels = valetMilestoneLabels[leg];
  const next = valet ? nextMilestone(VALET_MILESTONES, progress) : null;
  const finished = !!valet && !next;

  const lockedReason = isComplete(booking)
    ? "The service is complete, so the valet can't be changed."
    : progress.pickedUp
      ? "The valet already has the vehicle, so they can't be changed."
      : undefined;

  const milestones: Milestone[] = [
    { key: "assigned", label: "Valet assigned", done: !!valet },
    ...VALET_MILESTONES.map((key) => ({
      key,
      label: labels[key],
      done: !!progress[key],
      at: progress[key],
    })),
  ];

  const assign = (member: StaffMember) =>
    assignValet.mutate(
      { id: booking.id, leg, valetId: member.id },
      {
        onSuccess: () => {
          toast.success(`${member.name} assigned as ${legTitles[leg].toLowerCase()}`);
          setReplacement(null);
        },
      },
    );

  // Swapping a valet who's already on the way needs a confirmation
  const handleAssign = (member: StaffMember) =>
    progress.dispatched ? setReplacement(member) : assign(member);

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
        label={`${legTitles[leg]} assigned`}
        assigned={valet}
        link={staffLink(booking.id, leg)}
        saving={assignValet.isPending}
        lockedReason={lockedReason}
        onAssign={handleAssign}
      />

      <SectionCard>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-bold text-gray-900">Trip progress</h3>
          <p className="text-xs text-gray-500">
            The valet posts these from their link. You can also mark them here.
          </p>
        </div>

        <MilestoneTracker milestones={milestones} />
      </SectionCard>

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
          text={labels.delivered}
          actionLabel={isComplete(booking) ? undefined : nextStepLabels[leg]}
          onAction={onDone}
        />
      )}

      {replacement && (
        <ConfirmModal
          title="Change valet?"
          confirmLabel="Change valet"
          pendingLabel="Changing..."
          pending={assignValet.isPending}
          onConfirm={() => assign(replacement)}
          onClose={() => setReplacement(null)}
          stacked
        >
          {valet?.name} is already on the way. Assigning {replacement.name} starts this trip
          over from "Valet assigned".
        </ConfirmModal>
      )}
    </div>
  );
}
