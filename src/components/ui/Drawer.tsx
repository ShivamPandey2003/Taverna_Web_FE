import type { ReactNode } from "react";
import { X } from "reicon-react";

interface DrawerProps {
  title: ReactNode;
  // Shown under the title, e.g. customer and vehicle
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

// Side panel that slides in from the right and sits next to the page content: the
// parent is a flex row, so the content shrinks to the other half while it's open
// and takes the full width again once it closes. Covers the whole screen on phones.
export function Drawer({ title, subtitle, onClose, children }: DrawerProps) {
  return (
    <aside className="fixed inset-0 z-40 flex animate-drawer-in flex-col bg-white md:static md:z-auto md:w-1/2 md:min-w-130 md:shrink-0 md:border-l md:border-gray-200 md:shadow-[-8px_0_24px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 text-xl font-bold tracking-tight text-gray-900">
            {title}
          </div>
          {subtitle && (
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-sm text-gray-500">
              {subtitle}
            </div>
          )}
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
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
    </aside>
  );
}
