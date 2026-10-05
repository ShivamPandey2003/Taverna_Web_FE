import type { ReactNode } from "react";
import { cn } from "@/libs/utils";

type Tone = "neutral" | "pending" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-section text-text-secondary",
  pending: "bg-status-pending/12 text-status-pending",
  success: "bg-status-active/15 text-status-active",
  danger: "bg-danger/10 text-danger",
};

interface StateScreenProps {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  tone?: Tone;
  action?: ReactNode;
}

// Full card for "nothing to do here" moments: not assigned yet, waiting on
// someone else, trip finished, link broken
export function StateScreen({ icon, title, children, tone = "neutral", action }: StateScreenProps) {
  return (
    <section className="card flex flex-col items-center px-6 py-8 text-center">
      <span
        className={cn(
          "animate-pop flex h-16 w-16 items-center justify-center rounded-full",
          toneClasses[tone],
        )}
      >
        {icon}
      </span>
      <h2 className="mt-4 text-lg font-bold text-text">{title}</h2>
      {children && <div className="muted mt-1.5 max-w-[34ch]">{children}</div>}
      {action && <div className="mt-5 w-full">{action}</div>}
    </section>
  );
}
