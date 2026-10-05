import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Fingerprint } from "reicon-react";
import { cn } from "@/libs/utils";
import { Spinner } from "./Spinner";

// How long the button has to be held before it fires
const HOLD_MS = 800;

interface HoldToConfirmProps {
  label: string;
  pending?: boolean;
  pendingLabel?: string;
  disabled?: boolean;
  onConfirm: () => void;
}

// Status updates can't be undone, so they fire on press-and-hold instead of a tap:
// a pocket or a bump on the road can't trigger one. Holding works with gloves and
// either hand, unlike swipe-to-confirm. Keyboard: hold Space or Enter.
export function HoldToConfirm({
  label,
  pending = false,
  pendingLabel = "Saving...",
  disabled = false,
  onConfirm,
}: HoldToConfirmProps) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  // Shown when the button is let go too early
  const [tooShort, setTooShort] = useState(false);
  const frame = useRef<number | null>(null);
  const startedAt = useRef(0);

  const stopFrame = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };

  useEffect(() => stopFrame, []);

  const begin = () => {
    if (pending || disabled || frame.current !== null) return;
    setHolding(true);
    setTooShort(false);
    startedAt.current = performance.now();

    const tick = (now: number) => {
      const value = Math.min(1, (now - startedAt.current) / HOLD_MS);
      setProgress(value);
      if (value < 1) {
        frame.current = requestAnimationFrame(tick);
        return;
      }
      frame.current = null;
      setHolding(false);
      setProgress(0);
      navigator.vibrate?.(40);
      onConfirm();
    };
    frame.current = requestAnimationFrame(tick);
  };

  const release = () => {
    if (frame.current === null) return;
    stopFrame();
    setHolding(false);
    setProgress(0);
    setTooShort(true);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    begin();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === " " || event.key === "Enter") && !event.repeat) {
      event.preventDefault();
      begin();
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") release();
  };

  const inactive = pending || disabled;

  return (
    <div>
      <button
        type="button"
        disabled={inactive}
        aria-label={pending ? pendingLabel : `${label}. Press and hold to confirm.`}
        onPointerDown={handlePointerDown}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onBlur={release}
        onContextMenu={(event) => event.preventDefault()}
        className={cn(
          "relative flex h-16 w-full select-none items-center overflow-hidden rounded-button bg-text px-4 text-white transition active:scale-[0.99] [-webkit-touch-callout:none]",
          inactive && "cursor-not-allowed",
          disabled && "opacity-50",
        )}
      >
        {/* Fill that grows while held */}
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 bg-primary",
            !holding && "transition-[width] duration-200 ease-out",
          )}
          style={{ width: `${(pending ? 1 : progress) * 100}%` }}
        />

        <span className="relative flex w-full items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
            {pending ? <Spinner /> : <Fingerprint size={22} />}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-base font-bold leading-tight">
              {pending ? pendingLabel : label}
            </span>
            {!pending && (
              <span className="block text-xs font-medium text-white/70">
                {holding ? "Keep holding..." : "Press and hold to confirm"}
              </span>
            )}
          </span>
        </span>
      </button>

      <p aria-live="polite" className="mt-1.5 h-4 text-center text-xs font-medium text-text-secondary">
        {tooShort && !pending ? "Hold a little longer to confirm" : ""}
      </p>
    </div>
  );
}
