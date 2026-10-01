import type { ReactNode } from "react";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  title: ReactNode;
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
}

// Asks before a destructive action such as a delete
export function ConfirmModal({
  title,
  children,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pendingLabel = "Deleting...",
  pending = false,
  onConfirm,
  onClose,
  stacked,
}: ConfirmModalProps) {
  return (
    <Modal
      title={<h2>{title}</h2>}
      onClose={onClose}
      width="max-w-[440px]"
      stacked={stacked}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="h-10 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
