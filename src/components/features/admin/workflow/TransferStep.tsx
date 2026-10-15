import { useState, type ReactNode } from "react";
import { Building, Car, Check, Truck, User } from "reicon-react";
import { toast } from "sonner";
import { cn } from "@/libs/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  useConfirmBooking,
  useConfirmLegDone,
  useSetLegMethod,
} from "@/services/queries/adminQueries";
import {
  LEG_METHODS,
  TRIP_END,
  type AdminBooking,
  type IntakeMethod,
  type ValetLeg,
} from "@/types/admin";
import {
  formatDateTime,
  intakeMethodLabels,
  isComplete,
  legMethod,
  legTitles,
  valetTrip,
} from "../admin.utils";
import { ActionButton, SectionCard } from "./StepParts";
import { ValetStep } from "./ValetStep";

interface TransferStepProps {
  booking: AdminBooking;
  leg: ValetLeg;
  onDone: () => void;
}

const methodIcons: Record<IntakeMethod, ReactNode> = {
  valet: <User size={15} />,
  towTruck: <Truck size={15} />,
  selfDrive: <Car size={15} />,
};

// What each choice means on each trip
const methodDescriptions: Record<ValetLeg, Partial<Record<IntakeMethod, string>>> = {
  pickup: {
    valet: "A valet collects the vehicle from the customer.",
    towTruck: "A tow truck brings the vehicle in.",
    selfDrive: "The customer drives the vehicle in.",
  },
  delivery: {
    valet: "A valet returns the vehicle to the customer.",
    towTruck: "A tow truck returns the vehicle to the customer.",
    selfDrive: "The customer collects the vehicle from the dealership.",
  },
};

// The wording of each trip
const legText: Record<
  ValetLeg,
  {
    step: string;
    pickerLabel: string;
    choose: string;
    // The single thing to confirm when no valet makes the trip
    question: string;
    done: string;
    confirm: string;
    locked: string;
    next: string;
    icon: ReactNode;
  }
> = {
  pickup: {
    step: "Vehicle Intake",
    pickerLabel: "Vehicle comes in by",
    choose: "Choose how the vehicle gets to the dealership.",
    question: "Has the Vehicle Arrived at the Dealership?",
    done: "Vehicle Arrived at Dealership",
    confirm: "Confirm Vehicle Arrived",
    locked: "The vehicle is already at the dealership, so this can't be changed.",
    next: "Next: Assign Advisor",
    icon: <Building size={22} />,
  },
  delivery: {
    step: "Vehicle Handover",
    pickerLabel: "Vehicle goes back by",
    choose: "Choose how the vehicle gets back to the customer.",
    question: "Has the Vehicle Been Delivered to the Customer?",
    done: "Delivered to Customer",
    confirm: "Confirm Delivered to Customer",
    locked: "The vehicle is already back with the customer, so this can't be changed.",
    next: "Next: Complete Service",
    icon: <Car size={22} />,
  },
};

// How the vehicle makes the trip to the dealership (intake) or back to the
// customer (handover). A valet has a trip to follow; otherwise the admin only
// confirms that the vehicle got there.
export function TransferStep({ booking, leg, onDone }: TransferStepProps) {
  const setMethod = useSetLegMethod();
  // Both post booking/admin/:bmsId/confirm. A tow truck's intake is read off the
  // API's journey, like a valet's; self-drive also stamps the mock's copy
  const confirmDone = useConfirmLegDone();
  const confirmReceived = useConfirmBooking();
  // Picked in the row of choices, waiting for the admin to confirm
  const [picked, setPicked] = useState<IntakeMethod | null>(null);
  const closeConfirm = () => setPicked(null);

  const text = legText[leg];
  const descriptions = methodDescriptions[leg];
  const method = legMethod(booking, leg);
  // What the booked service allows, plus whatever an older booking already has
  const allowed = LEG_METHODS[booking.serviceId][leg];
  const options = method && !allowed.includes(method) ? [...allowed, method] : allowed;
  const complete = isComplete(booking);
  const { valet, progress } = valetTrip(booking, leg);
  const doneAt = progress[TRIP_END[leg]];

  const lockedReason = complete
    ? "The service is complete, so this can't be changed."
    : doneAt
      ? text.locked
      : progress.pickedUp
        ? "The valet already has the vehicle, so this can't be changed."
        : undefined;

  // Switching away from a valet takes them off the booking
  const warning =
    method === "valet" && valet
      ? `${valet.name} is removed as ${legTitles[leg].toLowerCase()} and their trip is cleared.`
      : undefined;

  const save = () => {
    if (!picked) return;
    setMethod.mutate(
      { id: booking.id, leg, method: picked },
      {
        onSuccess: () => {
          toast.success(`${text.step} set to ${intakeMethodLabels[picked]}`);
          closeConfirm();
        },
      },
    );
  };

  const viaApi = leg === "pickup" && method === "towTruck";
  const confirming = viaApi ? confirmReceived.isPending : confirmDone.isPending;
  const markDone = () => {
    const onSuccess = () => toast.success(text.done);
    if (viaApi) confirmReceived.mutate(booking.id, { onSuccess });
    else confirmDone.mutate({ id: booking.id, leg }, { onSuccess });
  };

  return (
    <div className="space-y-4">
      {/* One slim row: label on the left, the choices as a segmented control */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {text.pickerLabel}
        </p>

        <div className="flex gap-1 rounded-lg bg-gray-100 p-1" role="radiogroup">
          {options.map((option) => {
            const selected = option === method;

            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                // The selected one stays readable when the choice is locked
                disabled={!!lockedReason && !selected}
                title={lockedReason ?? descriptions[option]}
                onClick={() => {
                  if (!lockedReason && !selected) setPicked(option);
                }}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
                  selected
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-white hover:text-gray-900 disabled:hover:bg-transparent",
                  selected && lockedReason && "cursor-default",
                )}
              >
                {methodIcons[option]}
                {intakeMethodLabels[option]}
              </button>
            );
          })}
        </div>
      </div>

      {!method && (
        <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500">
          {text.choose}
        </p>
      )}

      {method === "valet" && <ValetStep booking={booking} leg={leg} onDone={onDone} />}

      {method && method !== "valet" && (
        // The only step: one centred status with its button underneath
        <SectionCard
          className={cn(
            "flex flex-col items-center px-6 py-8 text-center",
            doneAt && "border-status-active/40 bg-status-active/5",
          )}
        >
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border-2",
              doneAt
                ? "border-status-active bg-status-active/10 text-status-active"
                : "border-status-pending bg-status-pending/10 text-status-pending ring-4 ring-status-pending/15 motion-safe:animate-step-pulse",
            )}
          >
            {doneAt ? <Check size={22} strokeWidth={3} /> : text.icon}
          </span>

          <h3 className="mt-4 text-base font-bold text-gray-900">
            {doneAt ? text.done : text.question}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {doneAt ? formatDateTime(doneAt) : `${descriptions[method]} Confirm once it's done.`}
          </p>

          <div className="mt-5 w-full max-w-xs">
            {!doneAt && (
              <ActionButton pending={confirming} onClick={markDone}>
                {text.confirm}
              </ActionButton>
            )}
            {doneAt && !complete && (
              <button
                type="button"
                onClick={onDone}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                {text.next}
              </button>
            )}
          </div>
        </SectionCard>
      )}

      {picked && (
        <ConfirmModal
          title={`${text.step} by ${intakeMethodLabels[picked]}`}
          subtitle={`${booking.id} · ${booking.customer.name}`}
          confirmLabel="Confirm"
          pendingLabel="Saving..."
          pending={setMethod.isPending}
          tone={warning ? "danger" : "primary"}
          onConfirm={save}
          onClose={closeConfirm}
          // Over the drawer only, so the bookings table stays visible
          contained
        >
          <div className="space-y-3">
            <p>
              {descriptions[picked]}{" "}
              {picked === "valet" ? "You assign the valet next." : "You only confirm once it's done."}
            </p>

            {method && (
              <p>
                Replaces{" "}
                <span className="font-medium text-gray-900">{intakeMethodLabels[method]}</span>
              </p>
            )}

            {warning && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {warning}
              </p>
            )}
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}
