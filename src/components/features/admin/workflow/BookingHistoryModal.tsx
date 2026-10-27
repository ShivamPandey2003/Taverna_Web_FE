import { Check, History } from "reicon-react";
import { cn } from "@/libs/utils";
import { Modal } from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeBookingHistory,
  openBookingHistory,
  selectAdminModal,
  type WorkflowStep,
} from "@/redux/modals/adminModal/adminModalSlice";
import { useAdminBooking, useBookingHistory } from "@/services/queries/adminQueries";
import { statusName } from "@/services/bookingApi";
import type { BookingHistory, BookingHistoryEvent, HistoryActor } from "@/types/admin";
import { stepLabels } from "../admin.utils";

// ---- Formatting ----

const actorLabels: Record<string, string> = {
  USER: "Customer",
  ADMIN: "Admin",
  VALET_OPERATOR: "Valet",
  ADVISOR: "Advisor",
  TOW_OPERATOR: "Tow operator",
};

const actorLabel = (role: HistoryActor) => actorLabels[role] ?? statusName(role);

// What the event adds to the status change itself
const eventTags: Record<string, string> = {
  CUSTOMER_CONFIRMATION_APPROVED: "Customer approved",
  CUSTOMER_CONFIRMATION_REJECTED: "Customer rejected",
  PAYMENT_RECEIVED: "Payment received",
};

// Times are the dealership's, like the appointment. An unknown time zone falls
// back to the browser's.
function formatIn(value: string, timeZone: string | null, options: Intl.DateTimeFormatOptions) {
  try {
    return new Date(value).toLocaleString("en-US", { ...options, timeZone: timeZone ?? undefined });
  } catch {
    return new Date(value).toLocaleString("en-US", options);
  }
}

const timeOf = (value: string, zone: string | null) =>
  formatIn(value, zone, { hour: "numeric", minute: "2-digit" });

const dayOf = (value: string, zone: string | null) =>
  formatIn(value, zone, { weekday: "short", month: "short", day: "numeric" });

const dateTimeOf = (value: string, zone: string | null) =>
  formatIn(value, zone, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// "ET", "PT", …
function zoneName(zone: string | null) {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZoneName: "short",
      timeZone: zone ?? undefined,
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return part?.value.replace(/^([A-Z])[SD]T$/, "$1T") ?? "local time";
  } catch {
    return "local time";
  }
}

// 45 s -> "<1 min", 12 min, 1 h 5 min, 2 d 3 h
function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  return hours % 24 ? `${days} d ${hours % 24} h` : `${days} d`;
}

const between = (from: string, to: string) => Date.parse(to) - Date.parse(from);

// "VALET_DISPATCHED" -> "valetDispatched", the journey's name for its label
const toStepKey = (status: string) =>
  status.toLowerCase().replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());

// ---- Grouping ----

// The workflow step a status belongs to, so the history reads like the drawer's
// stepper. Anything not named here happens on the way in.
function stepOf(code: string): WorkflowStep {
  if (code === "SERVICE_COMPLETE") return "complete";
  if (code === "IN_QUEUE" || code === "BOOKED" || code.includes("CANCEL")) return "confirm";
  if (code.startsWith("DELIVERY_") || code === "VEHICLE_DELIVERED" || code === "CUSTOMER_DROP_OFF")
    return "delivery";
  if (
    /^(ADVISOR_|VEHICLE_IN_|INSPECTION_|INVOICE_|PAYMENT_)/.test(code) ||
    code === "READY_FOR_DISPATCH"
  )
    return "advisor";
  return "pickup";
}

interface Phase {
  step: WorkflowStep;
  // Where its events start in the whole list
  start: number;
  events: BookingHistoryEvent[];
}

// Back-to-back events of the same step. A booking sent back a step gets a
// second section rather than being folded into the first.
function toPhases(events: BookingHistoryEvent[]): Phase[] {
  const phases: Phase[] = [];
  events.forEach((event, index) => {
    const step = stepOf(event.toStatus);
    const last = phases.at(-1);
    if (last?.step === step) last.events.push(event);
    else phases.push({ step, start: index, events: [event] });
  });
  return phases;
}

// How long a step took: from the end of the step before (or its own first event
// for the first one) to its last event
function phaseDuration(phase: Phase, events: BookingHistoryEvent[]) {
  const from = events[phase.start - 1] ?? phase.events[0];
  return between(from.occurredAt, phase.events.at(-1)!.occurredAt);
}

// ---- Pieces ----

function Summary({ history }: { history: BookingHistory }) {
  const zone = history.timezone;
  const last = history.events.at(-1);

  const tiles = [
    { label: "Booked", value: dateTimeOf(history.bookedAt, zone) },
    {
      label: "Appointment",
      value: history.appointmentAt ? dateTimeOf(history.appointmentAt, zone) : "As soon as possible",
    },
    {
      label: history.isClosed ? "Total time" : "Running for",
      value: last ? formatDuration(between(history.bookedAt, last.occurredAt)) : "—",
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl bg-gray-50 px-3 py-2.5">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {tile.label}
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-gray-900">{tile.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface EventRowProps {
  event: BookingHistoryEvent;
  previous: BookingHistoryEvent | undefined;
  label: string;
  // The booking is at this status now and still open
  current: boolean;
  // Last of its section: no line down from it
  last: boolean;
  zone: string | null;
}

// One status change: a circle on a line like the trip trackers, the step's name,
// who did it, and when (the day on a new day, else the time since the one before)
function EventRow({ event, previous, label, current, last, zone }: EventRowProps) {
  const tag = eventTags[event.eventType];
  const newDay = !previous || dayOf(previous.occurredAt, zone) !== dayOf(event.occurredAt, zone);
  const actor = [event.performedByName, event.performedByRole && actorLabel(event.performedByRole)]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!last && (
        <span className="absolute bottom-1 left-[15px] top-9 w-0.5 rounded-full bg-status-active" />
      )}

      <span
        className={cn(
          "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
          current
            ? "border-status-pending bg-status-pending/10 ring-4 ring-status-pending/15 motion-safe:animate-step-pulse"
            : "border-status-active bg-status-active/10 text-status-active",
        )}
        aria-label={current ? "Current status" : "Done"}
      >
        {current ? (
          <span className="h-2 w-2 rounded-full bg-status-pending" />
        ) : (
          <Check size={15} strokeWidth={3} />
        )}
      </span>

      <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-1">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-gray-900">
            {label}
            {current && (
              <span className="rounded-full bg-status-pending/12 px-2 py-0.5 text-[11px] font-semibold text-[#c2410c]">
                Now
              </span>
            )}
            {tag && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                {tag}
              </span>
            )}
          </p>
          {actor && <p className="mt-0.5 text-xs text-gray-500">by {actor}</p>}
          {event.assignedStaffName && (
            <p className="mt-0.5 text-xs text-gray-500">
              Assigned <span className="font-medium text-gray-700">{event.assignedStaffName}</span>
              {event.assignedStaffRole && ` as ${actorLabel(event.assignedStaffRole)}`}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-medium tabular-nums text-gray-900">
            {timeOf(event.occurredAt, zone)}
          </p>
          <p className="text-[11px] text-gray-500">
            {newDay || !previous
              ? dayOf(event.occurredAt, zone)
              : `+${formatDuration(between(previous.occurredAt, event.occurredAt))}`}
          </p>
        </div>
      </div>
    </li>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-gray-100" />
          <div className="h-10 flex-1 animate-pulse rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

// ---- Exports ----

// Opens the history from the drawer's header
export function BookingHistoryButton() {
  const dispatch = useAppDispatch();
  return (
    <button
      data-test-id="booking-history-button"
      type="button"
      onClick={() => dispatch(openBookingHistory())}
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-gray-100 px-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 hover:text-gray-900"
    >
      <History size={16} />
      History
    </button>
  );
}

// Every status the workflow booking has been through, top to bottom, in sections
// named after the drawer's steps, each with how long it took. Over the drawer only.
export function BookingHistoryModal() {
  const dispatch = useAppDispatch();
  const { workflowBookingId, historyOpen } = useAppSelector(selectAdminModal);
  const id = historyOpen ? workflowBookingId : null;
  const { data: history, isPending, isError, refetch } = useBookingHistory(id);
  // Already loaded by the drawer: its journey has the API's name for each status
  const { data: booking } = useAdminBooking(workflowBookingId);

  if (!id) return null;

  const labels = new Map(booking?.journey?.steps.map((step) => [step.key, step.label]));
  const labelOf = (code: string) => labels.get(toStepKey(code)) ?? statusName(code);

  const zone = history?.timezone ?? null;
  const events = history?.events ?? [];
  const phases = toPhases(events);

  return (
    <Modal
      testId="booking-history-modal"
      title="Booking History"
      subtitle={history ? `${id} · Times in ${zoneName(zone)}` : id}
      onClose={() => dispatch(closeBookingHistory())}
      width="max-w-[560px]"
      contained
    >
      {isPending && <HistorySkeleton />}

      {isError && (
        <div className="py-10 text-center">
          <p className="text-sm text-gray-500">Couldn't load the history.</p>
          <button
            data-test-id="booking-history-retry"
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-button bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      )}

      {history && (
        <div className="space-y-6">
          <Summary history={history} />

          {events.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">
              Nothing has happened on this booking yet.
            </p>
          )}

          {phases.map((phase, phaseIndex) => {
            const done = history.isClosed || phaseIndex < phases.length - 1;
            return (
              <section key={phase.start}>
                <header className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500">
                    {stepLabels[phase.step]}
                  </h3>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      done
                        ? "bg-status-active/12 text-[#047a42]"
                        : "bg-status-pending/12 text-[#c2410c]",
                    )}
                  >
                    {!done && "In progress · "}
                    {formatDuration(phaseDuration(phase, events))}
                  </span>
                </header>

                <ol>
                  {phase.events.map((event, index) => {
                    const overall = phase.start + index;
                    return (
                      <EventRow
                        key={overall}
                        event={event}
                        previous={events[overall - 1]}
                        label={labelOf(event.toStatus)}
                        current={!history.isClosed && overall === events.length - 1}
                        last={index === phase.events.length - 1}
                        zone={zone}
                      />
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
