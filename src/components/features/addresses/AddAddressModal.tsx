import { Map2, Pin, MapArrowSquare, X } from 'reicon-react';
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/libs/utils';
import { addressSchema, type AddressFormData } from '@/schema/address.schema';
import type { Address, AddressType } from '@/types/address';
import { useAppSelector } from '@/redux/hooks';
import { selectAddressById, selectAddresses } from '@/redux/address/addressSlice';
import { GeocodeError } from '@/services/geocodeApi';
import {
  useCreateAddress,
  useGeocodeAddress,
  useUpdateAddress,
} from '@/services/queries/addressQueries';

// Visibility is owned by the page's modal slice; the address itself is saved through the API
interface AddAddressModalProps {
  open: boolean;
  // Id of the address to edit; omit to add a new one
  addressId?: string | null;
  onClose: () => void;
  onSaved?: (address: Address) => void;
}

const addressTypes: AddressType[] = ["home", "work", "other"];

export function AddAddressModal({
  open,
  addressId = null,
  onClose,
  onSaved,
}: AddAddressModalProps) {
  // Mount the form only while open so its values match the address being edited
  if (!open) {
    return null;
  }

  return (
    <AddressFormModal
      addressId={addressId}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function AddressFormModal({
  addressId,
  onClose,
  onSaved,
}: Omit<AddAddressModalProps, "open">) {
  const existing = useAppSelector((state) =>
    selectAddressById(state, addressId ?? null)
  );
  const hasAddresses = useAppSelector(selectAddresses).length > 0;
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const geocodeAddress = useGeocodeAddress();
  // Saving has two steps: finding where the address is, then storing it
  const locating = geocodeAddress.isPending;
  const saving = locating || createAddress.isPending || updateAddress.isPending;

  // Nothing closes the form while it's saving
  const close = () => {
    if (!saving) onClose();
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: existing?.type ?? "home",
      address: existing?.address ?? "",
      apartment: existing?.apartment ?? "",
      city: existing?.city ?? "",
      state: existing?.state ?? "",
      zip: existing?.zip ?? "",
    },
  });

  const selectedType = useWatch({ control, name: "type" });

  // The API needs the address's latitude and longitude. An edit that leaves the
  // street, city, state and ZIP alone keeps the ones it has.
  const findCoordinates = async (data: AddressFormData) => {
    const moved =
      !existing ||
      existing.address !== data.address ||
      existing.city !== data.city ||
      existing.state !== data.state ||
      existing.zip !== data.zip;

    if (!moved && existing.latitude != null && existing.longitude != null) {
      return { latitude: existing.latitude, longitude: existing.longitude };
    }
    return geocodeAddress.mutateAsync(data);
  };

  // The form stays open with what was typed whenever a step fails
  const onSubmit = async (data: AddressFormData) => {
    let coordinates;
    try {
      coordinates = await findCoordinates(data);
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

    try {
      if (existing) {
        const { id, ...current } = existing;
        const updated = await updateAddress.mutateAsync({
          id,
          address: { ...current, ...data, ...coordinates },
        });
        toast.success("Address updated");
        onSaved?.(updated);
      } else {
        // The first saved address becomes the default one
        const added = await createAddress.mutateAsync({
          ...data,
          ...coordinates,
          isDefault: !hasAddresses,
        });
        toast.success("Address added");
        onSaved?.(added);
      }

      onClose();
    } catch {
      // already toasted by the API layer
    }
  };

  return (
    <div className="absolute inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={close}
      />

      {/* Modal wrapper */}
      <div className="relative flex min-h-full items-center justify-center p-6">
        {/* Modal */}
        <div
          className="relative w-full max-w-[405px] overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-base font-bold text-gray-900">
              {existing ? "Edit Address" : "Add Address"}
            </h2>

            <button
              type="button"
              onClick={close}
              disabled={saving}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {/* Content */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="px-5 pb-5 pt-5"
          >
            {/* Map */}
            <div className="relative h-[170px] overflow-hidden rounded-xl bg-[#17202f]">
              {/* Fake map */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute left-[8%] top-[30%] h-px w-[85%] rotate-[-8deg] bg-slate-400" />

                <div className="absolute left-[10%] top-[55%] h-px w-[80%] rotate-[12deg] bg-slate-400" />

                <div className="absolute left-[45%] top-0 h-full w-px bg-slate-400" />

                <div className="absolute left-[60%] top-0 h-full w-px rotate-[18deg] bg-slate-400" />

                <div className="absolute left-[20%] top-[70%] h-px w-[65%] rotate-[-25deg] bg-slate-400" />
              </div>

              {/* Street labels */}
              <span className="absolute left-5 top-10 text-[9px] font-medium text-white/80">
                NE 13th St
              </span>

              <span className="absolute right-5 top-[42%] text-[9px] font-medium text-white/80">
                E Sunrise Blvd
              </span>

              {/* Location pin */}
              <div className="absolute left-1/2 top-[42%] flex -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                    <Pin
                      size={13}
                      fill="black"
                      className="text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Current location */}
              <button
                type="button"
                className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-3 py-2 text-[10px] font-semibold text-gray-900 shadow-md"
              >
                <MapArrowSquare
                  size={12}
                  fill="black"
                />

                Use My Current Location
              </button>
            </div>

            {/* Address Details; locked while saving */}
            <fieldset disabled={saving} className={cn("mt-5 transition", saving && "opacity-60")}>
              <h3 className="text-xs font-bold text-gray-900">
                Address Details
              </h3>

              {/* Type */}
              <div className="mt-4 flex gap-2">
                {addressTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setValue("type", type)}
                    className={cn(
                      "rounded-md border px-3 py-1 text-[11px] font-semibold capitalize transition",
                      selectedType === type
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-3">

                {/* Street */}
                <AddressField
                  label="Street Address"
                  id="address"
                  placeholder="1234 Main St"
                  icon={<Pin size={14} />}
                  registration={register("address")}
                  error={errors.address?.message}
                />

                {/* Apartment */}
                <AddressField
                  label={
                    <>
                      Apt, Suite, Building{" "}
                      <span className="font-normal text-gray-400">
                        (Optional)
                      </span>
                    </>
                  }
                  id="apartment"
                  placeholder="Apt 5B"
                  icon={<Map2 size={14} />}
                  registration={register("apartment")}
                  error={errors.apartment?.message}
                />

                {/* City */}
                <AddressField
                  label="City"
                  id="city"
                  placeholder="Fort Lauderdale"
                  icon={<Pin size={14} />}
                  registration={register("city")}
                  error={errors.city?.message}
                />

                {/* State + ZIP */}
                <div className="grid grid-cols-2 gap-3">
                  <AddressField
                    label="State"
                    id="state"
                    placeholder="FL"
                    icon={<Map2 size={14} />}
                    registration={register("state")}
                    error={errors.state?.message}
                  />

                  <AddressField
                    label="ZIP Code"
                    id="zip"
                    placeholder="33301"
                    icon={<Map2 size={14} />}
                    registration={register("zip")}
                    error={errors.zip?.message}
                  />
                </div>
              </div>
            </fieldset>

            {/* Save */}
            <button
              type="submit"
              disabled={saving}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#111827] text-xs font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-80"
            >
              {saving && <Spinner className="h-3.5 w-3.5" />}
              {locating
                ? "Locating Address..."
                : saving
                  ? "Saving..."
                  : existing
                    ? "Update Address"
                    : "Save Address"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

interface AddressFieldProps {
  label: React.ReactNode;
  id: string;
  placeholder: string;
  icon: React.ReactNode;
  registration: UseFormRegisterReturn;
  error?: string;
}

function AddressField({
  label,
  id,
  placeholder,
  icon,
  registration,
  error,
}: AddressFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-semibold text-gray-600"
      >
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>

        <input
          id={id}
          {...registration}
          placeholder={placeholder}
          className={cn(
            "h-9 w-full rounded-lg border bg-gray-50 pl-9 pr-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100",
            error ? "border-red-400" : "border-gray-200"
          )}
        />
      </div>

      {error && (
        <p className="mt-1 text-[10px] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
