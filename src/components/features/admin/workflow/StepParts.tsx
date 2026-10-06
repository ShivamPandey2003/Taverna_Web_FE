import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AngleDown,
  CheckCircle,
  Copy,
  CopySuccess,
  Link,
  Lock,
  Plus,
  Search,
  Share,
} from "reicon-react";
import { toast } from "sonner";
import { cn } from "@/libs/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAppDispatch } from "@/redux/hooks";
import { openAddStaff } from "@/redux/modals/adminModal/adminModalSlice";
import { useStaffOptions } from "@/services/queries/adminQueries";
import { staffRoleLabels } from "@/components/features/staff/staff.utils";
import type { AdminBooking, StaffMember, StaffRole } from "@/types/admin";
import { VehicleSummary } from "../VehicleSummary";

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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-active/40 bg-status-active/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <CheckCircle size={18} className="shrink-0 text-status-active" />
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
        tone === "dark" ? "bg-black hover:bg-gray-800" : "bg-black hover:bg-gray-800",
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

// "Pickup valet [ John Brooks v ]" and the member's personal link, side by side.
// Picking someone asks for a confirmation before they're assigned.
export function AssignmentRow({
  role,
  title,
  booking,
  assigned,
  link,
  saving,
  lockedReason,
  changeWarning,
  onAssign,
}: {
  role: StaffRole;
  // What they're assigned as, e.g. "Pickup valet"
  title: string;
  // The booking they're assigned to
  booking: AdminBooking;
  assigned: StaffMember | null;
  // null when the booking has no link for this role
  link: string | null;
  saving: boolean;
  // Why the assignment can't be changed any more, if it can't
  lockedReason?: string;
  // What replacing the current member undoes, if anything
  changeWarning?: string;
  // Call `done` once the assignment is saved, to close the confirmation
  onAssign: (member: StaffMember, done: () => void) => void;
}) {
  // Picked in the dropdown, waiting for the admin to confirm
  const [picked, setPicked] = useState<StaffMember | null>(null);
  const closeConfirm = () => setPicked(null);
  const warning = assigned ? changeWarning : undefined;

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
      <SectionCard className="flex min-w-0 flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <StaffSelect
          role={role}
          value={assigned}
          saving={saving}
          lockedReason={lockedReason}
          onChange={setPicked}
        />
      </SectionCard>

      <StaffLinkCard
        role={role}
        link={assigned ? link : null}
        shareTitle={`${title} link for booking ${booking.id}`}
      />

      {picked && (
        <ConfirmModal
          title={`${assigned ? "Change" : "Assign"} ${title.toLowerCase()}?`}
          subtitle={`${booking.id} · ${booking.customer.name}`}
          confirmLabel={assigned ? `Change ${staffRoleLabels[role]}` : `Assign ${staffRoleLabels[role]}`}
          pendingLabel={assigned ? "Changing..." : "Assigning..."}
          pending={saving}
          tone={warning ? "danger" : "primary"}
          onConfirm={() => onAssign(picked, closeConfirm)}
          onClose={closeConfirm}
          // Over the drawer only, so the bookings table stays visible
          contained
        >
          <div className="space-y-4">
            {/* The vehicle and the person, joined by a link on the right */}
            <div className="flex">
              <div className="grid min-w-0 flex-1 auto-rows-fr gap-3">
                <VehicleSummary
                  vehicle={booking.vehicle}
                  className="rounded-xl border border-gray-200 p-3"
                />

                <div className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 p-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-900 text-base font-semibold text-white">
                    {picked.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-gray-900">{picked.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {picked.phone} · {picked.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative w-10 shrink-0" aria-hidden="true">
                {/* Bracket from the middle of one card to the middle of the other
                    (3px = a quarter of the gap between them) */}
                <span className="absolute inset-y-[calc(25%-3px)] left-0 right-1/2 rounded-r-lg border-y border-r border-gray-300" />
                <span className="absolute left-1/2 top-1/2 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700">
                  <Link size={14} />
                </span>
              </div>
            </div>

            {assigned && (
              <p>
                Replaces <span className="font-medium text-gray-900">{assigned.name}</span>
              </p>
            )}

            {warning && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {warning}
              </p>
            )}
          </div>
        </ConfirmModal>
      )}
    </div>
  );
}

// Copies `value` to the clipboard; the icon turns into a tick for a moment
export function CopyButton({
  value,
  label,
  className,
  children,
}: {
  value: string;
  // What's being copied, for the toast and screen readers, e.g. "link"
  label: string;
  className?: string;
  // Text next to the icon, e.g. "Copy"; an icon-only button without it
  children?: ReactNode;
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
      {copied ? <CopySuccess size={15} className="text-black" /> : <Copy size={15} />}
      {children}
    </button>
  );
}

// The assigned member inside the dropdown box: initial, name, then phone and email,
// each with a button to copy it
function SelectedStaff({ member }: { member: StaffMember }) {
  // Above the box's own button, so a click copies instead of opening the list
  const copyClass = "relative z-10 h-6 w-6";

  return (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
        {member.name.charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-900">{member.name}</span>
        <span className="flex min-w-0 items-center text-xs text-gray-500">
          <span className="shrink-0">{member.phone}</span>
          <CopyButton value={member.phone} label="phone number" className={copyClass} />
          <span className="mx-1 shrink-0">·</span>
          <span className="min-w-0 truncate" title={member.email}>
            {member.email}
          </span>
          <CopyButton value={member.email} label="email" className={copyClass} />
        </span>
      </span>
    </>
  );
}

const linkButtonClass =
  "flex h-auto min-h-10 w-auto min-w-18 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-900 transition hover:border-gray-400 hover:bg-gray-50";

// Personal link the valet / advisor opens to post updates for this booking. The
// URL itself isn't shown: the admin copies it or sends it on.
function StaffLinkCard({
  role,
  link,
  shareTitle,
}: {
  role: StaffRole;
  link: string | null;
  // Goes with the link in the share sheet
  shareTitle: string;
}) {
  const roleLabel = staffRoleLabels[role];

  const handleShare = async () => {
    if (!link) return;
    // No share sheet in this browser: copying is the next best thing
    if (!navigator.share) {
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Link copied");
      } catch {
        toast.error("Couldn't copy the link");
      }
      return;
    }
    try {
      await navigator.share({ title: shareTitle, url: link });
    } catch {
      // The admin closed the share sheet
    }
  };

  return (
    <SectionCard className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {roleLabel} unique link
      </p>

      {link ? (
        // Tiles as tall as the card, which follows the assignee card next to it
        <div className="flex flex-1 gap-2">
          <CopyButton value={link} label="link" className={linkButtonClass}>
            Copy
          </CopyButton>
          <button type="button" onClick={handleShare} className={linkButtonClass}>
            <Share size={15} className="text-gray-500" />
            Share
          </button>
        </div>
      ) : (
        <p className="flex h-10 items-center text-sm text-gray-400">
          Shows up once {withArticle(roleLabel)} is assigned
        </p>
      )}
    </SectionCard>
  );
}

// Dropdown of every valet / advisor with search
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
        className={cn(
          "flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3",
          value ? "h-14" : "h-10",
        )}
        title={lockedReason}
      >
        {value ? (
          <SelectedStaff member={value} />
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
            No {roleLabel}
          </span>
        )}
        <Lock size={15} className="shrink-0 text-gray-400" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "relative flex items-center gap-3 rounded-lg border px-3 transition",
          value ? "h-14" : "h-10",
          open ? "border-gray-900" : "border-gray-300 hover:border-gray-400",
          saving && "opacity-60",
        )}
      >
        {/* The whole box opens the list; the copy buttons sit above this button */}
        <button
          type="button"
          disabled={saving}
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={value ? `Change ${roleLabel}` : `Select ${withArticle(roleLabel)}`}
          className="absolute inset-0 rounded-lg disabled:cursor-wait"
        />

        {value && !saving ? (
          <SelectedStaff member={value} />
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm text-gray-400">
            {saving ? "Saving..." : `Select ${withArticle(roleLabel)}`}
          </span>
        )}
        <AngleDown
          size={16}
          className={cn("shrink-0 text-gray-500 transition-transform", open && "rotate-180")}
        />
      </div>

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
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-900">
                      {member.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900">
                        {member.name}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {member.phone} · {member.email}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        current
                          ? "bg-gray-900 text-white"
                          : member.available
                            ? "bg-gray-100 text-gray-900"
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
