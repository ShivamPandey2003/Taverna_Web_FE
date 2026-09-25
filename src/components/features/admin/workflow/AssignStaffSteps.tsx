import { useState } from "react";
import { Plus, Search } from "reicon-react";
import { toast } from "sonner";
import { cn } from "@/libs/utils";
import type { AdminBooking, StaffMember, StaffRole } from "@/types/admin";
import { useAppDispatch } from "@/redux/hooks";
import { openAddStaff } from "@/redux/modals/adminModal/adminModalSlice";
import {
  useAssignRelationshipManager,
  useAssignValet,
  useStaffOptions,
} from "@/services/queries/adminQueries";
import { staffRoleLabels } from "@/components/features/staff/staff.utils";

interface StepProps {
  booking: AdminBooking;
  onDone: () => void;
}

export function AssignValetStep({ booking, onDone }: StepProps) {
  const valets = useStaffOptions("valet");
  const assignValet = useAssignValet();

  return (
    <StaffPicker
      role="valet"
      title="Assign a valet"
      description="The valet picks the vehicle up from the customer and drives it to the dealership."
      staff={valets.data?.items}
      loading={valets.isPending}
      assigned={booking.valet}
      saving={assignValet.isPending}
      submitLabel="Assign Valet"
      onSubmit={(valetId) =>
        assignValet.mutate(
          { id: booking.id, valetId },
          {
            onSuccess: (updated) => {
              toast.success(`${updated.valet?.name} assigned as valet`);
              onDone();
            },
          },
        )
      }
    />
  );
}

export function AssignManagerStep({ booking, onDone }: StepProps) {
  const managers = useStaffOptions("manager");
  const assignManager = useAssignRelationshipManager();

  return (
    <StaffPicker
      role="manager"
      title="Assign a relationship manager"
      description="The relationship manager is the customer's point of contact until the service is complete."
      staff={managers.data?.items}
      loading={managers.isPending}
      assigned={booking.relationshipManager}
      saving={assignManager.isPending}
      submitLabel="Assign Relationship Manager"
      onSubmit={(managerId) =>
        assignManager.mutate(
          { id: booking.id, managerId },
          {
            onSuccess: (updated) => {
              toast.success(`${updated.relationshipManager?.name} assigned as relationship manager`);
              onDone();
            },
          },
        )
      }
    />
  );
}

interface StaffPickerProps {
  role: StaffRole;
  title: string;
  description: string;
  staff?: StaffMember[];
  loading: boolean;
  assigned: StaffMember | null;
  saving: boolean;
  submitLabel: string;
  onSubmit: (staffId: string) => void;
}

function StaffPicker({
  role,
  title,
  description,
  staff,
  loading,
  assigned,
  saving,
  submitLabel,
  onSubmit,
}: StaffPickerProps) {
  const dispatch = useAppDispatch();
  const [selectedId, setSelectedId] = useState<string | null>(assigned?.id ?? null);
  const [search, setSearch] = useState("");
  const unchanged = selectedId === (assigned?.id ?? null);

  const roleLabel = staffRoleLabels[role];
  const query = search.trim().toLowerCase();
  const digits = query.replace(/\D/g, "");
  const results = staff?.filter(
    (member) =>
      !query ||
      member.name.toLowerCase().includes(query) ||
      (digits !== "" && member.phone.replace(/\D/g, "").includes(digits)),
  );
  const hasAvailable = results?.some((member) => member.available) ?? false;

  // Pre-fill the new member's name with the search unless it looks like a phone number
  const handleAdd = () =>
    dispatch(openAddStaff({ role, name: digits === "" ? search.trim() : "" }));

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-900 transition hover:bg-gray-50"
        >
          <Plus size={14} strokeWidth={2.5} />
          Add {roleLabel}
        </button>
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search ${roleLabel}s by name or phone`}
          className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
        />
      </div>

      <div className="mt-3 grid max-h-[280px] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
        {loading &&
          Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}

        {results?.map((member) => {
          const selected = member.id === selectedId;
          // Someone already assigned stays selectable even if now marked busy
          const disabled = !member.available && member.id !== assigned?.id;

          return (
            <button
              key={member.id}
              type="button"
              disabled={disabled}
              onClick={() => setSelectedId(member.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                selected
                  ? "border-2 border-gray-900"
                  : "border-gray-200 hover:border-gray-300",
                disabled && "cursor-not-allowed opacity-50 hover:border-gray-200",
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
                {member.name.charAt(0)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-500">{member.phone}</p>
              </div>

              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  member.id === assigned?.id
                    ? "bg-gray-900 text-white"
                    : member.available
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-500",
                )}
              >
                {member.id === assigned?.id
                  ? "Assigned"
                  : member.available
                    ? "Available"
                    : "Busy"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Nobody matches, or nobody who matches is free: offer to add someone */}
      {results && !hasAvailable && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            {results.length === 0
              ? query
                ? `No ${roleLabel}s match "${search.trim()}".`
                : `No ${roleLabel}s yet.`
              : `No ${roleLabel}s are available right now.`}
          </p>

          <button
            type="button"
            onClick={handleAdd}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-black px-3 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            <Plus size={14} strokeWidth={2.5} />
            Add new {roleLabel}
          </button>
        </div>
      )}

      <button
        type="button"
        disabled={!selectedId || unchanged || saving}
        onClick={() => selectedId && onSubmit(selectedId)}
        className="mt-5 h-11 w-full rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? "Saving..." : assigned ? "Reassign" : submitLabel}
      </button>
    </div>
  );
}
