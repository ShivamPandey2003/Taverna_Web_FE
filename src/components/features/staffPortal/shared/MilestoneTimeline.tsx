import { Check } from "reicon-react";
import { cn } from "@/libs/utils";
import { formatShortDateTime } from "@/components/features/admin/admin.utils";

export interface Milestone {
  key: string;
  label: string;
  done: boolean;
  // When it happened, if known
  at?: string;
}

interface MilestoneTimelineProps {
  milestones: Milestone[];
  // "horizontal" puts the steps in one row; only for short lists, on a phone
  // each step gets a narrow column
  direction?: "vertical" | "horizontal";
}

// Steps of a trip or service: green once reached, orange for the one that's up
// next, grey for the rest. Vertical by default, which reads better on a phone
// when there are many steps.
export function MilestoneTimeline({ milestones, direction = "vertical" }: MilestoneTimelineProps) {
  const nextIndex = milestones.findIndex((milestone) => !milestone.done);

  if (direction === "horizontal") {
    return (
      <ol className="flex items-start">
        {milestones.map((milestone, index) => {
          const isNext = index === nextIndex;

          return (
            <li
              key={milestone.key}
              className="relative flex min-w-0 flex-1 flex-col items-center text-center"
            >
              {/* Line back to the step before, behind both circles */}
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute right-1/2 top-[13px] h-0.5 w-full",
                    milestones[index - 1].done ? "bg-status-active" : "bg-border",
                  )}
                />
              )}

              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  milestone.done
                    ? "border-status-active bg-status-active text-white"
                    : isNext
                      ? "border-status-pending bg-white text-status-pending ring-4 ring-status-pending/15 motion-safe:animate-step-pulse"
                      : "border-border bg-white text-gray-400",
                )}
              >
                {milestone.done ? <Check size={14} strokeWidth={3} /> : index + 1}
              </span>

              <span
                className={cn(
                  "mt-2 max-w-full break-words px-0.5 text-[11px] leading-tight",
                  milestone.done && "font-semibold text-text",
                  isNext && "font-bold text-text",
                  !milestone.done && !isNext && "text-gray-400",
                )}
              >
                {milestone.label}
                {isNext && <span className="sr-only"> (up next)</span>}
              </span>

              {milestone.at && (
                <time dateTime={milestone.at} className="mt-0.5 text-[10px] text-text-secondary">
                  {formatShortDateTime(milestone.at)}
                </time>
              )}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol>
      {milestones.map((milestone, index) => {
        const isNext = index === nextIndex;
        const isLast = index === milestones.length - 1;

        return (
          <li key={milestone.key} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[13px] top-7 bottom-0 w-0.5 rounded-full",
                  milestone.done ? "bg-status-active" : "bg-border",
                )}
              />
            )}

            <span
              className={cn(
                "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                milestone.done
                  ? "border-status-active bg-status-active text-white"
                  : isNext
                    ? "border-status-pending bg-white text-status-pending ring-4 ring-status-pending/15 motion-safe:animate-step-pulse"
                    : "border-border bg-white text-gray-400",
              )}
            >
              {milestone.done ? <Check size={14} strokeWidth={3} /> : index + 1}
            </span>

            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 pt-0.5">
              <span
                className={cn(
                  "text-sm leading-snug",
                  milestone.done && "font-semibold text-text",
                  isNext && "font-bold text-text",
                  !milestone.done && !isNext && "text-gray-400",
                )}
              >
                {milestone.label}
                {isNext && <span className="sr-only"> (up next)</span>}
              </span>

              {milestone.at ? (
                <time dateTime={milestone.at} className="shrink-0 text-xs text-text-secondary">
                  {formatShortDateTime(milestone.at)}
                </time>
              ) : (
                isNext && <span className="chip chip-pending shrink-0">Up next</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
