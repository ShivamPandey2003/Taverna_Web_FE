import type { ReactNode } from "react";
import { cn } from "@/libs/utils";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  title: ReactNode;
  // Shown under the title, e.g. the booking it's about
  subtitle?: ReactNode;
  // What will happen, e.g. "Delete Jane Doe? This can't be undone."
  children: ReactNode;
  confirmLabel?: string;
  // The way out, e.g. "Keep booking" when the action itself is a cancellation
  cancelLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  // Renders above another open modal
  stacked?: boolean;
  // Covers only the nearest positioned parent (e.g. the drawer) instead of the whole screen
  contained?: boolean;
  // "danger" (red) for deletes and resets, "primary" (black) for a plain double-check
  tone?: "danger" | "primary";
  // data-test-id of the dialog; its buttons get "<testId>-confirm" / "<testId>-cancel"
  testId?: string;
}

// Asks before an action that's destructive or easy to get wrong
export function ConfirmModal({
  title,
  subtitle,
  children,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pendingLabel = "Deleting...",
  pending = false,
  onConfirm,
  onClose,
  stacked,
  contained,
  tone = "danger",
  testId = "confirm-modal",
}: ConfirmModalProps) {
  return (
    <Modal
      title={<h2>{title}</h2>}
      subtitle={subtitle}
      onClose={onClose}
      width="max-w-[440px]"
      stacked={stacked}
      contained={contained}
      testId={testId}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            data-test-id={`${testId}-cancel`}
            className="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            data-test-id={`${testId}-confirm`}
            disabled={pending}
            // Enter confirms a plain double-check; a destructive one needs a deliberate click
            autoFocus={tone === "primary"}
            className={cn(
              "h-10 rounded-lg px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50",
              tone === "danger" ? "bg-red-600 hover:bg-red-700" : "bg-black hover:bg-gray-800",
            )}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </>
      }
    >
      <div className="text-sm text-gray-600">{children}</div>
    </Modal>
  );
}
