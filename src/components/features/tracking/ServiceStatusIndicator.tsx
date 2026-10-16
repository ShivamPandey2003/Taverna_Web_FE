import { cn } from "@/libs/utils";
import type { StatusDisplay } from "./serviceStatus";

interface ServiceStatusIndicatorProps {
  display: StatusDisplay;
  // "lg" for the toast, "sm" for compact spots
  size?: "lg" | "sm";
}

// Coloured status label, or an arrival countdown while the vehicle is on the way
export function ServiceStatusIndicator({ display, size = "lg" }: ServiceStatusIndicatorProps) {
  const color = display.color.text;

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
      title={display.label}
      className={cn(
        "font-bold leading-tight",
        // The small one sits beside a vehicle's name: it takes at most 40% of the
        // row and wraps to two lines, so the name and VIN stay readable
        size === "lg"
          ? "w-[84px] shrink-0 text-center text-lg"
          : "line-clamp-2 max-w-[40%] shrink-0 text-right text-sm",
        color,
      )}
    >
      {display.label}
    </span>
  );
}
