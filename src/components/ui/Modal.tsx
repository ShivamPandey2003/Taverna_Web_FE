import type { ReactNode } from "react";
import { X } from "reicon-react";
import { cn } from "@/libs/utils";

interface ModalProps {
  title: ReactNode;
  // Shown under the title, e.g. customer and vehicle
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  // Sticky action bar under the scrolling body
  footer?: ReactNode;
  // Tailwind max-width class for the dialog
  width?: string;
  // Renders above another open modal
  stacked?: boolean;
}

// Centred dialog with a backdrop, a header with a close button and a scrolling body
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = "max-w-[760px]",
  stacked = false,
}: ModalProps) {
  return (
    <div className={cn("fixed inset-0", stacked ? "z-[60]" : "z-50")}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal wrapper */}
      <div className="relative flex h-full items-center justify-center p-6">
        {/* Modal */}
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative flex max-h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl",
            width,
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 text-xl font-bold tracking-tight text-gray-900">
                {title}
              </div>
              {subtitle && <p className="mt-0.5 truncate text-sm text-gray-500">{subtitle}</p>}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-5">{children}</div>

          {footer && (
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
