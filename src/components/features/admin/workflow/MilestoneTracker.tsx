import { ArrowRight, Check } from "reicon-react";
import { cn } from "@/libs/utils";
import { formatShortDateTime } from "../admin.utils";

export interface Milestone {
  key: string;
  label: string;
  done: boolean;
  // When it happened, if known
  at?: string;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
}

// Row of circles joined by arrows: green once reached, orange for the one that's
// up next, grey for the rest. Scrolls sideways when the drawer is narrow.
export function MilestoneTracker({ milestones }: MilestoneTrackerProps) {
  const nextIndex = milestones.findIndex((milestone) => !milestone.done);

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <ol className="flex min-w-max items-start">
        {milestones.map((milestone, index) => {
          const isNext = index === nextIndex;

          return (
            <li key={milestone.key} className="flex items-start">
              {index > 0 && (
                <ArrowRight
                  size={18}
                  strokeWidth={2.5}
                  className={cn(
                    "mx-1 mt-3 shrink-0",
                    milestone.done ? "text-status-active" : "text-gray-300",
                  )}
                />
              )}

              <div className="flex w-[84px] flex-col items-center text-center">
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border-2 text-sm font-bold transition",
                    milestone.done
                      ? "border-status-active bg-status-active/15 text-status-active"
                      : isNext
                        ? "border-status-pending bg-status-pending/10 text-status-pending ring-4 ring-status-pending/15"
                        : "border-gray-200 bg-gray-50 text-gray-400",
                  )}
                  aria-label={milestone.done ? "Done" : isNext ? "Up next" : "Not yet"}
                >
                  {milestone.done ? <Check size={18} strokeWidth={3} /> : index + 1}
                </span>

                <span
                  className={cn(
                    "mt-2 text-[11px] font-semibold leading-tight",
                    milestone.done || isNext ? "text-gray-900" : "text-gray-400",
                  )}
                >
                  {milestone.label}
                </span>

                {milestone.at && (
                  <span className="mt-0.5 text-[10px] text-gray-500">
                    {formatShortDateTime(milestone.at)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
