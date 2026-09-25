import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { useCreateStaff, useUpdateStaff } from "@/services/queries/adminQueries";
import { staffSchema, type StaffFormData } from "@/schema/staff.schema";
import type { StaffMember, StaffRole } from "@/types/admin";
import { staffRoleLabels } from "./staff.utils";

// Visibility is owned by the page's modal slice
interface StaffFormModalProps {
  open: boolean;
  role: StaffRole;
  // Member to edit; omit to add a new one
  member?: StaffMember | null;
  // Pre-fills the name when adding, e.g. with what the admin searched for
  defaultName?: string;
  onClose: () => void;
  // Renders above another open modal
  stacked?: boolean;
}

export function StaffFormModal({ open, ...props }: StaffFormModalProps) {
  // Mount the form only while open so its values match the member being edited
  if (!open) {
    return null;
  }

  return <StaffForm {...props} />;
}

function StaffForm({
  role,
  member = null,
  defaultName = "",
  onClose,
  stacked,
}: Omit<StaffFormModalProps, "open">) {
  const createStaff = useCreateStaff(role);
  const updateStaff = useUpdateStaff(role);
  const saving = createStaff.isPending || updateStaff.isPending;
  const roleLabel = staffRoleLabels[role];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: member?.name ?? defaultName,
      phone: member?.phone ?? "",
      available: member?.available ?? true,
    },
  });

  const onSubmit = (data: StaffFormData) => {
    if (member) {
      updateStaff.mutate(
        { id: member.id, input: data },
        {
          onSuccess: (updated) => {
            toast.success(`${updated.name} updated`);
            onClose();
          },
        },
      );
    } else {
      createStaff.mutate(data, {
        onSuccess: (created) => {
          toast.success(`${created.name} added as ${roleLabel}`);
          onClose();
        },
      });
    }
  };

  return (
    <Modal
      title={
        <h2 className="capitalize">
          {member ? "Edit" : "Add"} {roleLabel}
        </h2>
      }
      onClose={onClose}
      width="max-w-[440px]"
      stacked={stacked}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Full name" htmlFor="staff-name" error={errors.name?.message}>
          <input
            id="staff-name"
            autoFocus
            placeholder="Jane Doe"
            {...register("name")}
            className="form-input"
          />
        </FormField>

        <FormField label="Phone number" htmlFor="staff-phone" error={errors.phone?.message}>
          <input
            id="staff-phone"
            type="tel"
            placeholder="(954) 555-0100"
            {...register("phone")}
            className="form-input"
          />
        </FormField>

        <label className="flex h-11 cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50">
          <input type="checkbox" {...register("available")} className="h-4 w-4 accent-black" />
          Available for new bookings
        </label>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : member ? "Save Changes" : `Add ${roleLabel}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
