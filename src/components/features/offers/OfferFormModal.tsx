import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { FormField } from "@/components/ui/FormField";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeDeleteOffer,
  closeEditOffer,
  selectOffersModal,
} from "@/redux/modals/offersModal/offersModalSlice";
import { useDeleteOffer, useUpdateOffer } from "@/services/queries/adminQueries";
import { offerSchema, type OfferFormData } from "@/schema/offer.schema";
import type { Offer } from "@/types/offer";
import { offerVehicle } from "./offer.utils";

// Edits one offer, opened from its row or its details modal
export function OfferFormModal() {
  const { editing } = useAppSelector(selectOffersModal);

  // Mount the form only while open so its values match the offer being edited
  if (!editing) {
    return null;
  }

  return <OfferForm offer={editing} />;
}

// What each plain input edits; the two long texts are textareas below them
const fields: {
  name: Exclude<keyof OfferFormData, "description" | "disclaimer">;
  label: string;
  // Number inputs; `step` allows cents or APR decimals
  number?: boolean;
  step?: string;
}[] = [
  { name: "vin", label: "VIN" },
  { name: "stockNumber", label: "Stock number" },
  { name: "condition", label: "Condition" },
  { name: "year", label: "Year", number: true },
  { name: "brand", label: "Brand" },
  { name: "model", label: "Model" },
  { name: "trim", label: "Trim" },
  { name: "offerType", label: "Offer type" },
  { name: "lender", label: "Lender" },
  { name: "payment", label: "Payment / month ($)", number: true, step: "0.01" },
  { name: "paymentNoTax", label: "Payment before tax ($)", number: true, step: "0.01" },
  { name: "term", label: "Term (months)", number: true },
  { name: "apr", label: "APR (%)", number: true, step: "0.001" },
  { name: "downPayment", label: "Down payment ($)", number: true, step: "0.01" },
  { name: "dueAtSigning", label: "Due at signing ($)", number: true, step: "0.01" },
  { name: "totalRebate", label: "Total rebate ($)", number: true, step: "0.01" },
];

function OfferForm({ offer }: { offer: Offer }) {
  const dispatch = useAppDispatch();
  const updateOffer = useUpdateOffer();

  // Everything but the id is editable
  const { id, ...values } = offer;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: values,
  });

  const onClose = () => dispatch(closeEditOffer());

  const onSubmit = (data: OfferFormData) =>
    updateOffer.mutate(
      { id, input: { ...data, vin: data.vin.toUpperCase() } },
      {
        onSuccess: (updated) => {
          toast.success(`Offer for ${offerVehicle(updated)} updated`);
          onClose();
        },
      },
    );

  return (
    <Modal
      title={<h2>Edit Offer</h2>}
      subtitle={`${offerVehicle(offer)} · Stock ${offer.stockNumber}`}
      onClose={onClose}
      width="max-w-[820px]"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="offer-form"
            disabled={updateOffer.isPending}
            className="h-10 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateOffer.isPending ? "Saving..." : "Save Changes"}
          </button>
        </>
      }
    >
      <form id="offer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <FormField
              key={field.name}
              label={field.label}
              htmlFor={`offer-${field.name}`}
              error={errors[field.name]?.message}
            >
              <input
                id={`offer-${field.name}`}
                type={field.number ? "number" : "text"}
                step={field.step}
                min={field.number ? 0 : undefined}
                {...register(field.name, { valueAsNumber: !!field.number })}
                className="form-input"
              />
            </FormField>
          ))}
        </div>

        <FormField
          label="Description"
          htmlFor="offer-description"
          error={errors.description?.message}
        >
          <textarea
            id="offer-description"
            rows={2}
            {...register("description")}
            className="form-input h-auto resize-none py-2.5"
          />
        </FormField>

        <FormField label="Disclaimer" htmlFor="offer-disclaimer" error={errors.disclaimer?.message}>
          <textarea
            id="offer-disclaimer"
            rows={3}
            {...register("disclaimer")}
            className="form-input h-auto resize-none py-2.5"
          />
        </FormField>
      </form>
    </Modal>
  );
}

// Asks before an offer is removed for good
export function DeleteOfferModal() {
  const dispatch = useAppDispatch();
  const { deleting } = useAppSelector(selectOffersModal);
  const deleteOffer = useDeleteOffer();

  if (!deleting) {
    return null;
  }

  const onClose = () => dispatch(closeDeleteOffer());

  // A failed delete is toasted by the API layer
  const handleDelete = () =>
    deleteOffer.mutate(deleting.id, {
      onSuccess: () => {
        toast.success(`Offer for ${offerVehicle(deleting)} deleted`);
        onClose();
      },
    });

  return (
    <ConfirmModal
      title="Delete Offer"
      subtitle={`VIN ${deleting.vin} · Stock ${deleting.stockNumber}`}
      onClose={onClose}
      onConfirm={handleDelete}
      pending={deleteOffer.isPending}
    >
      Are you sure you want to delete the{" "}
      <span className="font-semibold text-gray-900">{deleting.offerType}</span> offer for the{" "}
      <span className="font-semibold text-gray-900">{offerVehicle(deleting)}</span>? This can't
      be undone.
    </ConfirmModal>
  );
}
