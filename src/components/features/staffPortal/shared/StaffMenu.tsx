import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AngleDown, Logout, TaskSquare, User } from "reicon-react";
import { cn, initials } from "@/libs/utils";
import type { StaffMember } from "@/types/admin";

const itemClass =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors";

// Avatar in the staff brand bar that opens a menu with who's signed in, the way
// back to the task list and Log Out (the staff counterpart of the app's ProfileDropdown). `member` is null
// when the sign-in has no task yet to read the name from.
export function StaffMenu({
  member,
  tasksPath,
  onSignOut,
}: {
  member: Pick<StaffMember, "name" | "email"> | null;
  // The task list to go back to; null when that's the page already open
  tasksPath: string | null;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on a click outside the avatar + menu, or on Escape
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${member?.name ?? "staff"}`}
      >
        {/* Initials only; the full name is in the menu */}
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-900">
          {member ? initials(member.name) : <User size={18} />}
        </span>
        <AngleDown
          size={16}
          className={cn("text-gray-500 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]"
        >
          <div className="border-b border-gray-100 px-3 pb-2.5 pt-2">
            <p className="truncate text-sm font-semibold text-gray-900">
              {member?.name ?? "Staff"}
            </p>
            {member?.email && <p className="truncate text-xs text-gray-500">{member.email}</p>}
          </div>

          <div className="pt-1.5">
            {tasksPath && (
              <Link
                to={tasksPath}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(itemClass, "text-gray-700 hover:bg-gray-100")}
              >
                <TaskSquare size={18} />
                My Tasks
              </Link>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className={cn(itemClass, "text-red-600 hover:bg-red-50")}
            >
              <Logout size={18} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
