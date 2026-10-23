import { toast } from "sonner";
import { useAssignValet, useConfirmBooking } from "@/services/queries/adminQueries";
import {
  HANDOVER_DELIVERED,
  HANDOVER_JOURNEY,
  INTAKE_ARRIVED,
  INTAKE_CONFIRMED,
  INTAKE_JOURNEY,
  journeyReached,
  type AdminBooking,
  type StaffMember,
  type ValetLeg,
} from "@/types/admin";
import { isComplete, legTitles, staffLink, valetTrip } from "../admin.utils";
import { MilestoneTracker, type Milestone } from "./MilestoneTracker";
import { ActionButton, AssignmentRow, SectionCard, StepDone } from "./StepParts";

interface ValetStepProps {
  booking: AdminBooking;
  leg: ValetLeg;
  onDone: () => void;
}

// Each trip on the API's journey: the steps shown, and the one that ends the step
const legJourney: Record<ValetLeg, { steps: readonly string[]; end: string; next: string }> = {
  pickup: { steps: INTAKE_JOURNEY, end: INTAKE_CONFIRMED, next: "Next: Assign Advisor" },
  delivery: { steps: HANDOVER_JOURNEY, end: HANDOVER_DELIVERED, next: "Next: Complete Service" },
};

// Assign a valet, share their link, and follow the trip step by step. It's drawn
// from the API's journey (`booking.journey`): the valet posts the steps from
// their own page, so the admin only watches. The pickup trip then ends with the
// admin confirming the vehicle was received at the dealership; the delivery
// trip ends by itself once the valet has delivered the vehicle. The next
// workflow step stays locked until then.
export function ValetStep({ booking, leg, onDone }: ValetStepProps) {
  const assignValet = useAssignValet();
  const confirmReceived = useConfirmBooking();

  const { valet, progress } = valetTrip(booking, leg);
  const { journey } = booking;
  const track = legJourney[leg];
  const reached = (key: string) => !!journey && journeyReached(journey, key);
  const stepLabel = (key: string) => journey?.steps.find((step) => step.key === key)?.label;
  // The pickup valet's trip is over and the vehicle waits for the admin to confirm it
  const awaitingReceipt = !!valet && leg === "pickup" && journey?.current === INTAKE_ARRIVED;
  const finished = !!valet && reached(track.end);

  const complete = isComplete(booking);

  const lockedReason = complete
    ? "The service is complete, so the valet can't be changed."
    : progress.pickedUp
      ? "The valet already has the vehicle, so they can't be changed."
      : undefined;

  // The API only says when the current step was reached
  const milestones: Milestone[] = track.steps.flatMap((key) => {
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
          </div>

          <MilestoneTracker milestones={milestones} />
        </SectionCard>
      )}

      {!valet && (
        <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
          Assign a valet to start the trip.
        </p>
      )}

      {awaitingReceipt && (
        <ActionButton pending={confirmReceived.isPending} onClick={markReceived}>
          Confirm Vehicle Received
        </ActionButton>
      )}

      {finished && (
        <StepDone
          text={stepLabel(track.end) ?? "Trip complete"}
          actionLabel={complete ? undefined : track.next}
          onAction={onDone}
        />
      )}
    </div>
  );
}
