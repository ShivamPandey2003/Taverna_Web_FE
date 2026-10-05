import { cn } from "@/libs/utils";

type Tone = "active" | "pending" | "muted";

// Orange while waiting on someone, green while things move along or are done
export function StatusChip({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span className={cn("chip shrink-0", `chip-${tone}`)}>
      <span className="chip-dot" />
      {children}
    </span>
  );
}
