import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/libs/utils";
import type { AdminBooking, StaffMember } from "@/types/admin";
import {
  useAssignRelationshipManager,
  useAssignValet,
  useRelationshipManagers,
  useValets,
} from "@/services/queries/adminQueries";

interface StepProps {
  booking: AdminBooking;
  onDone: () => void;
}

export function AssignValetStep({ booking, onDone }: StepProps) {
  const valets = useValets();
  const assignValet = useAssignValet();

  return (
    <StaffPicker
      title="Assign a valet"
      description="The valet picks the vehicle up from the customer and drives it to the dealership."
      staff={valets.data}
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
  const managers = useRelationshipManagers();
  const assignManager = useAssignRelationshipManager();

  return (
    <StaffPicker
      title="Assign a relationship manager"
      description="The relationship manager is the customer's point of contact until the service is complete."
      staff={managers.data}
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
  title,
  description,
  staff,
  loading,
  assigned,
  saving,
  submitLabel,
  onSubmit,
}: StaffPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(assigned?.id ?? null);
  const unchanged = selectedId === (assigned?.id ?? null);

  return (
    <div className="rounded-xl border border-gray-200 p-5">
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {loading &&
          Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}

        {staff?.map((member) => {
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
