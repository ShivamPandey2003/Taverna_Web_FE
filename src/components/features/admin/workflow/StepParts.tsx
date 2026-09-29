import { useEffect, useRef, useState, type ReactNode } from "react";
import { AngleDown, CheckCircle, Copy, CopySuccess, Lock, Plus, Search } from "reicon-react";
import { toast } from "sonner";
import { cn } from "@/libs/utils";
import { useAppDispatch } from "@/redux/hooks";
import { openAddStaff } from "@/redux/modals/adminModal/adminModalSlice";
import { useStaffOptions } from "@/services/queries/adminQueries";
import { staffRoleLabels } from "@/components/features/staff/staff.utils";
import type { StaffMember, StaffRole } from "@/types/admin";

// "a valet", "an advisor"
const withArticle = (word: string) => `${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;

// Green banner for a finished step, with an optional button to move on
export function StepDone({
  text,
  actionLabel,
  onAction,
}: {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
        <CheckCircle size={18} className="shrink-0 text-emerald-600" />
        {text}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// The one thing to do next in a step
export function ActionButton({
  children,
  pending,
  pendingLabel = "Saving...",
  onClick,
  tone = "dark",
}: {
  children: ReactNode;
  pending: boolean;
  pendingLabel?: string;
  onClick: () => void;
  tone?: "dark" | "success";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={cn(
        "h-11 w-full rounded-lg text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50",
        tone === "dark" ? "bg-black hover:bg-gray-800" : "bg-status-active hover:brightness-95",
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function SectionCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-gray-200 p-4", className)}>{children}</section>
  );
}

// "Valet assigned [ John Brooks v ]" and the member's personal link, side by side
export function AssignmentRow({
  role,
  label,
  assigned,
  link,
  saving,
  lockedReason,
  onAssign,
}: {
  role: StaffRole;
  label: string;
  assigned: StaffMember | null;
  link: string;
  saving: boolean;
  // Why the assignment can't be changed any more, if it can't
  lockedReason?: string;
  onAssign: (member: StaffMember) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <SectionCard className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <StaffSelect
          role={role}
          value={assigned}
          saving={saving}
          lockedReason={lockedReason}
          onChange={onAssign}
        />
      </SectionCard>

      <StaffLinkCard role={role} link={assigned ? link : null} />
    </div>
  );
}

// Copies `value` to the clipboard; the icon turns into a tick for a moment
export function CopyButton({
  value,
  label,
  className,
}: {
  value: string;
  // What's being copied, for the toast and screen readers, e.g. "link"
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label.charAt(0).toUpperCase()}${label.slice(1)} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(`Couldn't copy the ${label}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900",
        className,
      )}
    >
      {copied ? <CopySuccess size={15} className="text-status-active" /> : <Copy size={15} />}
    </button>
  );
}

// Personal link the valet / advisor opens to post updates for this booking
function StaffLinkCard({ role, link }: { role: StaffRole; link: string | null }) {
  const roleLabel = staffRoleLabels[role];

  return (
    <SectionCard className="flex min-w-0 flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {roleLabel} unique link
      </p>

      {link ? (
        <div className="flex h-10 items-center gap-2 rounded-lg bg-gray-50 pl-3 pr-1">
          <span className="min-w-0 flex-1 truncate text-sm text-blue-700" title={link}>
            {link}
          </span>
          <CopyButton value={link} label="link" className="h-8 w-8 hover:bg-white" />
        </div>
      ) : (
        <p className="flex h-10 items-center text-sm text-gray-400">
          Shows up once {withArticle(roleLabel)} is assigned
        </p>
      )}
    </SectionCard>
  );
}

// Dropdown of every valet / advisor with search; picking someone assigns them
function StaffSelect({
  role,
  value,
  saving,
  lockedReason,
  onChange,
}: {
  role: StaffRole;
  value: StaffMember | null;
  saving: boolean;
  lockedReason?: string;
  onChange: (member: StaffMember) => void;
}) {
  const dispatch = useAppDispatch();
  const staff = useStaffOptions(role);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const roleLabel = staffRoleLabels[role];

  // Close on a click outside, or on Escape
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

  const query = search.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");
  const results = staff.data?.items.filter(
    (member) =>
      !query ||
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      (digits !== "" && member.phone.replace(/\D/g, "").includes(digits)),
  );

  const choose = (member: StaffMember) => {
    setOpen(false);
    setSearch("");
    if (member.id !== value?.id) onChange(member);
  };

  // Pre-fill the new member's name with the search unless it looks like a phone number
  const handleAdd = () => {
    setOpen(false);
    dispatch(openAddStaff({ role, name: digits === "" ? search.trim() : "" }));
  };

  if (lockedReason) {
    return (
      <div
        className="flex h-10 items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3"
        title={lockedReason}
      >
        <span className="truncate text-sm font-semibold text-gray-900">
          {value?.name ?? `No ${roleLabel}`}
        </span>
        <Lock size={15} className="shrink-0 text-gray-400" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={saving}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-3 text-left transition disabled:cursor-wait disabled:opacity-60",
          open ? "border-gray-900" : "border-gray-300 hover:border-gray-400",
        )}
      >
        <span
          className={cn(
            "truncate text-sm",
            value ? "font-semibold text-gray-900" : "text-gray-400",
          )}
        >
          {saving ? "Saving..." : (value?.name ?? `Select ${withArticle(roleLabel)}`)}
        </span>
        <AngleDown
          size={16}
          className={cn("shrink-0 text-gray-500 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          <div className="relative border-b border-gray-100 p-2">
            <Search size={15} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or phone"
              className="h-9 w-full rounded-lg bg-gray-50 pl-8 pr-3 text-sm outline-none placeholder:text-gray-400 focus:bg-gray-100"
            />
          </div>

          <ul role="listbox" className="max-h-[240px] overflow-y-auto p-1">
            {staff.isPending && (
              <li className="px-3 py-2.5 text-sm text-gray-500">Loading...</li>
            )}

            {results?.length === 0 && (
              <li className="px-3 py-2.5 text-sm text-gray-500">
                {query ? `No ${roleLabel}s match "${search.trim()}"` : `No ${roleLabel}s yet`}
              </li>
            )}

            {results?.map((member) => {
              const current = member.id === value?.id;
              // Someone already assigned stays selectable even if now marked busy
              const disabled = !member.available && !current;

              return (
                <li key={member.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={current}
                    disabled={disabled}
                    onClick={() => choose(member)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                      current ? "bg-gray-100" : "hover:bg-gray-50",
                      disabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                      {member.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {member.name}
                      </span>
                      <span className="block text-xs text-gray-500">{member.phone}</span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        current
                          ? "bg-gray-900 text-white"
                          : member.available
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {current ? "Assigned" : member.available ? "Available" : "Busy"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={handleAdd}
            className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            <Plus size={15} strokeWidth={2.5} />
            Add new {roleLabel}
          </button>
        </div>
      )}
    </div>
  );
}
