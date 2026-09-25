import { cn } from "@/libs/utils";
import type { StatusDisplay } from "./serviceStatus";

interface ServiceStatusIndicatorProps {
  display: StatusDisplay;
  // "lg" for the toast, "sm" for the sidebar card
  size?: "lg" | "sm";
}

// Coloured status label, or an arrival countdown while the vehicle is on the way
export function ServiceStatusIndicator({ display, size = "lg" }: ServiceStatusIndicatorProps) {
  const color =
    display.tone === "pending" ? "text-status-pending" : "text-status-active";

  if (display.etaMinutes !== undefined) {
    return size === "lg" ? (
      <div className="flex w-[84px] shrink-0 flex-col items-center leading-none">
        <span className="text-[11px] font-medium text-gray-500">Arriving in</span>
        <span className={cn("mt-1 text-[28px] font-bold", color)}>{display.etaMinutes}</span>
        <span className={cn("mt-0.5 text-sm font-bold", color)}>mins</span>
      </div>
    ) : (
      <span className={cn("shrink-0 text-sm font-bold", color)}>{display.etaMinutes} mins</span>
    );
  }

  return (
    <span
      className={cn(
        "shrink-0 text-center font-bold leading-tight",
        size === "lg" ? "w-[84px] text-lg" : "text-sm",
        color,
      )}
    >
      {display.label}
    </span>
  );
}
