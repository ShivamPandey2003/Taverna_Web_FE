import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeDealershipForm,
  selectDealershipModal,
} from "@/redux/modals/dealershipModal/dealershipModalSlice";
import { useCreateDealership, useUpdateDealership } from "@/services/queries/adminQueries";
import { dealershipSchema, type DealershipFormData } from "@/schema/dealership.schema";
import type { Dealership } from "@/types/dealership";

// Adds a dealership, or edits one when opened from a card
export function DealershipFormModal() {
  const { formOpen, editing } = useAppSelector(selectDealershipModal);

  // Mount the form only while open so its values match the dealership being edited
  if (!formOpen) {
    return null;
  }

  return <DealershipForm dealership={editing} />;
}

function DealershipForm({ dealership }: { dealership: Dealership | null }) {
  const dispatch = useAppDispatch();
  const createDealership = useCreateDealership();
  const updateDealership = useUpdateDealership();
  const saving = createDealership.isPending || updateDealership.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DealershipFormData>({
    resolver: zodResolver(dealershipSchema),
    defaultValues: {
      name: dealership?.name ?? "",
      address: dealership?.address ?? "",
      image: dealership?.image ?? "",
      valetAvailable: dealership?.valetAvailable ?? true,
      loanerAvailable: dealership?.loanerAvailable ?? true,
    },
  });

  const onClose = () => dispatch(closeDealershipForm());

  const onSubmit = (data: DealershipFormData) => {
    if (dealership) {
      updateDealership.mutate(
        { id: dealership.id, input: data },
        {
          onSuccess: (updated) => {
            toast.success(`${updated.name} updated`);
            onClose();
          },
        },
      );
    } else {
      createDealership.mutate(data, {
        onSuccess: (created) => {
          toast.success(`${created.name} added`);
          onClose();
        },
      });
    }
  };

  return (
    <Modal
      title={<h2>{dealership ? "Edit Dealership" : "Add Dealership"}</h2>}
      onClose={onClose}
      width="max-w-[520px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Dealership name" htmlFor="dealership-name" error={errors.name?.message}>
          <input
            id="dealership-name"
            autoFocus
            placeholder="Taverna CDJR Miami"
            {...register("name")}
            className="form-input"
          />
        </FormField>

        <FormField label="Address" htmlFor="dealership-address" error={errors.address?.message}>
          <input
            id="dealership-address"
            placeholder="123 Biscayne Blvd, Miami, FL 33132"
            {...register("address")}
            className="form-input"
          />
        </FormField>

        <FormField
          label={
            <>
              Image URL <span className="font-normal text-gray-400">(optional)</span>
            </>
          }
          htmlFor="dealership-image"
          error={errors.image?.message}
        >
          <input
            id="dealership-image"
            type="url"
            placeholder="https://..."
            {...register("image")}
            className="form-input"
          />
        </FormField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Toggle label="Valet available" registration={register("valetAvailable")} />
          <Toggle label="Loaner available" registration={register("loanerAvailable")} />
        </div>

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
            {saving ? "Saving..." : dealership ? "Save Changes" : "Add Dealership"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Toggle({ label, registration }: { label: string; registration: UseFormRegisterReturn }) {
  return (
    <label className="flex h-11 cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50">
      <input type="checkbox" {...registration} className="h-4 w-4 accent-black" />
      {label}
    </label>
  );
}
