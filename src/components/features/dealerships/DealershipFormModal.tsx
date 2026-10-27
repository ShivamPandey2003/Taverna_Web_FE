import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  closeDealershipForm,
  selectDealershipModal,
} from "@/redux/modals/dealershipModal/dealershipModalSlice";
import { GeocodeError } from "@/services/geocodeApi";
import {
  useCreateDealership,
  useGeocodeDealership,
  useUpdateDealership,
} from "@/services/queries/dealershipQueries";
import { dealershipSchema, type DealershipFormData } from "@/schema/dealership.schema";
import type { Dealership } from "@/types/dealership";

const DEFAULT_TIMEZONE = "America/New_York";

const timezones = [
  { value: "America/New_York", label: "Eastern (New York)" },
  { value: "America/Chicago", label: "Central (Chicago)" },
  { value: "America/Denver", label: "Mountain (Denver)" },
  { value: "America/Phoenix", label: "Mountain, no DST (Phoenix)" },
  { value: "America/Los_Angeles", label: "Pacific (Los Angeles)" },
  { value: "America/Anchorage", label: "Alaska (Anchorage)" },
  { value: "Pacific/Honolulu", label: "Hawaii (Honolulu)" },
];

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
  const geocodeDealership = useGeocodeDealership();
  // Saving has two steps: finding where the address is, then storing it
  const locating = geocodeDealership.isPending;
  const saving = locating || createDealership.isPending || updateDealership.isPending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DealershipFormData>({
    resolver: zodResolver(dealershipSchema),
    defaultValues: {
      dealerId: "",
      name: dealership?.name ?? "",
      address: dealership?.address ?? "",
      serviceRadiusMiles: dealership?.serviceRadiusMiles ?? 25,
      timezone: dealership?.timezone || DEFAULT_TIMEZONE,
      isActive: dealership?.isActive ?? true,
    },
  });

  // A timezone the list doesn't have stays selectable on the dealership that has it
  const timezoneOptions =
    dealership?.timezone && !timezones.some((zone) => zone.value === dealership.timezone)
      ? [...timezones, { value: dealership.timezone, label: dealership.timezone }]
      : timezones;

  // Nothing closes the form while it's saving
  const onClose = () => {
    if (!saving) dispatch(closeDealershipForm());
  };

  // The API needs the address's latitude and longitude. An edit that leaves the
  // address alone keeps the ones it has.
  const findCoordinates = async (address: string) => {
    if (
      dealership &&
      dealership.address === address &&
      Number.isFinite(dealership.latitude) &&
      Number.isFinite(dealership.longitude)
    ) {
      return { latitude: dealership.latitude, longitude: dealership.longitude };
    }
    return geocodeDealership.mutateAsync(address);
  };

  // The form stays open with what was typed whenever a step fails
  const onSubmit = async ({ dealerId, ...data }: DealershipFormData) => {
    if (!dealership && !dealerId) {
      setError("dealerId", { message: "Dealer ID is required" });
      return;
    }

    let coordinates;
    try {
      coordinates = await findCoordinates(data.address);
    } catch (error) {
      // Not our API, so nothing has reported this yet
      if (error instanceof GeocodeError && error.reason === "notFound") {
        setError("address", {
          message: "We couldn't find this address. Check the street, city, state and ZIP code.",
        });
      } else {
        toast.error("We couldn't look up this address. Check your connection and try again.");
      }
      return;
    }

    const input = { ...data, ...coordinates };

    try {
      if (dealership) {
        await updateDealership.mutateAsync({ id: dealership.id, input });
        toast.success(`${data.name} updated`);
      } else {
        await createDealership.mutateAsync({ dealerId, input });
        toast.success(`${data.name} added`);
      }

      dispatch(closeDealershipForm());
    } catch {
      // already toasted by the API layer
    }
  };

  return (
    <Modal
      testId="dealership-form-modal"
      title={<h2>{dealership ? "Edit Dealership" : "Add Dealership"}</h2>}
      onClose={onClose}
      width="max-w-[520px]"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Locked while saving */}
        <fieldset disabled={saving} className={cn("space-y-4 transition", saving && "opacity-60")}>
          {/* The API takes the dealer's ID only when the dealership is added */}
          {!dealership && (
            <FormField label="Dealer ID" htmlFor="dealership-dealer-id" error={errors.dealerId?.message}>
              <input
                data-test-id="dealership-dealer-id-input"
                id="dealership-dealer-id"
                autoFocus
                placeholder="The dealer's own ID"
                {...register("dealerId")}
                className="form-input"
              />
            </FormField>
          )}

          <FormField label="Dealership name" htmlFor="dealership-name" error={errors.name?.message}>
            <input
              data-test-id="dealership-name-input"
              id="dealership-name"
              autoFocus={!!dealership}
              placeholder="Taverna CDJR Miami"
              {...register("name")}
              className="form-input"
            />
          </FormField>

          <FormField label="Address" htmlFor="dealership-address" error={errors.address?.message}>
            <input
              data-test-id="dealership-address-input"
              id="dealership-address"
              placeholder="123 Biscayne Blvd, Miami, FL 33132"
              {...register("address")}
              className="form-input"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Service radius (miles)"
              htmlFor="dealership-radius"
              error={errors.serviceRadiusMiles?.message}
            >
              <input
                data-test-id="dealership-radius-input"
                id="dealership-radius"
                type="number"
                min={1}
                step="any"
                {...register("serviceRadiusMiles", { valueAsNumber: true })}
                className="form-input"
              />
            </FormField>

            <FormField label="Timezone" htmlFor="dealership-timezone" error={errors.timezone?.message}>
              <select data-test-id="dealership-timezone-select" id="dealership-timezone" {...register("timezone")} className="form-input">
                {timezoneOptions.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <label className="flex h-11 cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50">
            <input data-test-id="dealership-active-checkbox" type="checkbox" {...register("isActive")} className="h-4 w-4 accent-black" />
            Active (customers can choose it for new bookings)
          </label>
        </fieldset>

        <div className="flex justify-end gap-3 pt-5">
          <button
            data-test-id="dealership-form-cancel"
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            data-test-id="dealership-form-save"
            type="submit"
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {saving && <Spinner className="h-3.5 w-3.5" />}
            {locating
              ? "Locating Address..."
              : saving
                ? "Saving..."
                : dealership
                  ? "Save Changes"
                  : "Add Dealership"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
