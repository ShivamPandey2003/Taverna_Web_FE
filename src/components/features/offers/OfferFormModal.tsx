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
import { OFFER_CONDITIONS } from "./offer.utils";
import { maskedVin } from "@/libs/utils";

// Edits one offer, opened from its row or its details modal
export function OfferFormModal() {
  const { editing } = useAppSelector(selectOffersModal);

  // Mount the form only while open so its values match the offer being edited
  if (!editing) {
    return null;
  }

  return <OfferForm offer={editing} />;
}

// What each plain input edits; condition is a select and the two long texts
// are textareas
const fields: {
  name: Exclude<keyof OfferFormData, "condition" | "description" | "disclaimer">;
  label: string;
  // Number inputs; `step` allows cents or APR decimals
  number?: boolean;
  step?: string;
}[] = [
  { name: "vin", label: "VIN" },
  { name: "stockNumber", label: "Stock number" },
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

// The API's condition in the form's spelling ("new" -> "New"); anything else
// is left for the admin to pick
const toCondition = (condition: string) =>
  OFFER_CONDITIONS.find((item) => item.toLowerCase() === condition.trim().toLowerCase());

function OfferForm({ offer }: { offer: Offer }) {
  const dispatch = useAppDispatch();
  const updateOffer = useUpdateOffer();
  const saving = updateOffer.isPending;

  // Everything but the id and the API-built name is editable
  const { id, vehicleName, ...values } = offer;
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: { ...values, condition: toCondition(values.condition) },
  });

  const onClose = () => dispatch(closeEditOffer());

  // A failed save is toasted by the API layer; the form stays open
  const onSubmit = (data: OfferFormData) =>
    updateOffer.mutate(
      { id, input: { ...data, vin: data.vin.toUpperCase() } },
      {
        onSuccess: () => {
          toast.success(`Offer for ${data.year} ${data.brand} ${data.model} updated`);
          onClose();
        },
      },
    );

  return (
    <Modal
      title={<h2>Edit Offer</h2>}
      subtitle={`${vehicleName} · Stock ${offer.stockNumber}`}
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
            disabled={saving || !isDirty}
            className="h-10 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </>
      }
    >
      <form id="offer-form" onSubmit={handleSubmit(onSubmit)}>
        {/* Locked while saving */}
        <fieldset disabled={saving} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              label="Condition"
              htmlFor="offer-condition"
              error={errors.condition?.message}
            >
              <select id="offer-condition" {...register("condition")} className="form-input">
                <option value="">Choose...</option>
                {OFFER_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition}
                  </option>
                ))}
              </select>
            </FormField>

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

          <FormField
            label="Disclaimer"
            htmlFor="offer-disclaimer"
            error={errors.disclaimer?.message}
          >
            <textarea
              id="offer-disclaimer"
              rows={4}
              {...register("disclaimer")}
              className="form-input h-auto resize-none py-2.5"
            />
          </FormField>
        </fieldset>
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
        toast.success(`Offer for ${deleting.vehicleName} deleted`);
        onClose();
      },
    });

  return (
    <ConfirmModal
      title="Delete Offer"
      subtitle={`VIN ${maskedVin(deleting.vin)} · Stock ${deleting.stockNumber}`}
      onClose={onClose}
      onConfirm={handleDelete}
      pending={deleteOffer.isPending}
    >
      Are you sure you want to delete the{" "}
      <span className="font-semibold text-gray-900">{deleting.offerType}</span> offer for the{" "}
      <span className="font-semibold text-gray-900">{deleting.vehicleName}</span>? This can't be
      undone.
    </ConfirmModal>
  );
}
