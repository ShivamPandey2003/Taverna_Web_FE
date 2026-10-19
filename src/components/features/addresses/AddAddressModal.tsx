import { useRef, useState } from 'react';
import { Map2, Pin, X } from 'reicon-react';
import { useForm, useWatch, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/libs/utils';
import { addressSchema, type AddressFormData } from '@/schema/address.schema';
import type { Address, AddressType } from '@/types/address';
import { useAppSelector } from '@/redux/hooks';
import {
  selectAddressById,
  selectAddresses,
  selectDefaultAddress,
} from '@/redux/address/addressSlice';
import { getDevicePosition, toLatLng, type LatLng } from '@/libs/maps';
import {
  GeocodeError,
  reverseGeocode,
  type AddressPlace,
  type Coordinates,
} from '@/services/geocodeApi';
import { placeDetails, suggestPlaces, type PlaceSuggestion } from '@/services/placesApi';
import { searchUsStates } from '@/libs/usStates';
import { AddressMap } from './AddressMap';
import { SuggestField } from './SuggestField';
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

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

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
  // What's typed in the fields that suggest as you type
  const [streetValue, cityValue, stateValue, zipValue] = useWatch({
    control,
    name: ["address", "city", "state", "zip"],
  });

  // The map's pin: where the address is, once known
  const [pin, setPin] = useState<LatLng | null>(() =>
    toLatLng(existing?.latitude, existing?.longitude),
  );
  // Without a pin the map starts at the customer's default address
  const defaultAddress = useAppSelector(selectDefaultAddress);
  const fallbackCenter = toLatLng(defaultAddress?.latitude, defaultAddress?.longitude);
  // The address the pin filled in, and where the pin was: saved as it is, the
  // address keeps the pin's exact position instead of being looked up again
  const [pinned, setPinned] = useState<{ position: LatLng; place: AddressPlace } | null>(null);
  // Getting the device's location, or the address at the pin
  const [finding, setFinding] = useState(false);
  // Only the latest pick fills the form, however the lookups finish
  const latestPick = useRef(0);

  // A spot picked on the map (tap, drag, or the device's location): the form is
  // filled with the address there
  const pickPosition = async (position: LatLng) => {
    const pick = ++latestPick.current;
    setPin(position);
    setFinding(true);
    try {
      const place = await reverseGeocode(position.lat, position.lng);
      if (pick !== latestPick.current) return;
      (["address", "city", "state", "zip"] as const).forEach((field) =>
        setValue(field, place[field], { shouldDirty: true, shouldValidate: true }),
      );
      setPinned({ position, place });
    } catch (error) {
      if (pick !== latestPick.current) return;
      setPinned(null);
      toast.error(
        error instanceof GeocodeError && error.reason === "notFound"
          ? "We couldn't find an address there. Enter it below."
          : "We couldn't look up the address there. Enter it below.",
      );
    } finally {
      if (pick === latestPick.current) setFinding(false);
    }
  };

  // Suggestions near the pin, else near the default address
  const near: Coordinates | null = pin
    ? { latitude: pin.lat, longitude: pin.lng }
    : fallbackCenter
      ? { latitude: fallbackCenter.lat, longitude: fallbackCenter.lng }
      : null;

  // Puts a picked suggestion's parts in the form. Empty parts are skipped;
  // `onlyEmpty` leaves fields the customer already filled alone.
  const fill = (parts: Partial<AddressPlace>, onlyEmpty = false) => {
    const current: AddressPlace = { address: streetValue, city: cityValue, state: stateValue, zip: zipValue };
    (Object.entries(parts) as [keyof AddressPlace, string | undefined][]).forEach(([field, value]) => {
      if (!value || (onlyEmpty && current[field].trim())) return;
      setValue(field, value, { shouldDirty: true, shouldValidate: true });
    });
  };

  // A suggestion's details (where it is, its city, state, ZIP); null when they
  // couldn't be fetched (already toasted) or a later pick has taken over
  const pickSuggestion = async (suggestion: PlaceSuggestion) => {
    const pick = ++latestPick.current;
    setFinding(true);
    try {
      const details = await placeDetails(suggestion);
      return pick === latestPick.current ? details : null;
    } catch {
      if (pick === latestPick.current) {
        toast.error("We couldn't get the details of that place. Pick another or type it in.");
      }
      return null;
    } finally {
      if (pick === latestPick.current) setFinding(false);
    }
  };

  // A street picked: the whole address is filled in and the pin moves there
  const pickStreet = async (suggestion: PlaceSuggestion) => {
    const details = await pickSuggestion(suggestion);
    if (!details) return;
    const place = { ...details.place, address: details.place.address || suggestion.main };
    fill(place);
    const position = { lat: details.coordinates.latitude, lng: details.coordinates.longitude };
    setPin(position);
    setPinned({ position, place });
  };

  // A city picked: its state comes with it
  const pickCity = async (suggestion: PlaceSuggestion) => {
    const details = await pickSuggestion(suggestion);
    if (!details) return;
    fill({ city: details.place.city || suggestion.main, state: details.place.state });
  };

  // A ZIP picked: its city and state fill in the fields still empty
  const pickZip = async (suggestion: PlaceSuggestion) => {
    const details = await pickSuggestion(suggestion);
    if (!details) return;
    fill({ zip: details.place.zip || suggestion.main });
    fill({ city: details.place.city, state: details.place.state }, true);
  };

  const useCurrentLocation = async () => {
    setFinding(true);
    let position: LatLng;
    try {
      position = await getDevicePosition();
    } catch (error) {
      setFinding(false);
      toast.error(error instanceof Error ? error.message : "We couldn't get your location.");
      return;
    }
    await pickPosition(position);
  };

  // The API needs the address's latitude and longitude. An edit that leaves the
  // street, city, state and ZIP alone keeps the ones it has.
  const findCoordinates = async (data: AddressFormData) => {
    // Filled in from the pin and still the same street and city: the pin's position
    if (
      pinned &&
      sameText(data.address, pinned.place.address) &&
      sameText(data.city, pinned.place.city)
    ) {
      return { latitude: pinned.position.lat, longitude: pinned.position.lng };
    }

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
    // Over the window, not inside the page: on a short screen the backdrop still
    // covers everything and the page behind never scrolls
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={close}
      />

      {/* Modal wrapper */}
      <div className="pointer-events-none relative flex h-full items-center justify-center p-4 sm:p-6">
        {/* Modal: at most the window's height; the map and fields scroll inside
            it while the header and Save button stay put */}
        <div
          className="pointer-events-auto relative flex max-h-full w-full max-w-[405px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between px-5 pt-5">
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
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* Scrolls on a short screen */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-1 pt-4">
            {/* Map: picking a spot fills in the address below */}
            <AddressMap
              pin={pin}
              fallbackCenter={fallbackCenter}
              onPick={pickPosition}
              onUseCurrentLocation={useCurrentLocation}
              busy={finding}
              disabled={saving}
            />

            {/* Address Details; locked while saving */}
            <fieldset disabled={saving} className={cn("mt-4 transition", saving && "opacity-60")}>
              <h3 className="text-xs font-bold text-gray-900">
                Address Details
              </h3>

              {/* Type */}
              <div className="mt-3 flex gap-2">
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

              <div className="mt-3 space-y-2.5">

                {/* Street: suggests addresses; a pick fills in the rest */}
                <SuggestField
                  label="Street Address"
                  id="address"
                  placeholder="1234 Main St"
                  icon={<Pin size={14} />}
                  registration={register("address")}
                  value={streetValue}
                  error={errors.address?.message}
                  suggest={(text, signal) => suggestPlaces(text, near, signal, "address")}
                  onPick={pickStreet}
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

                {/* City: suggests cities (with their state) */}
                <SuggestField
                  label="City"
                  id="city"
                  placeholder="Fort Lauderdale"
                  icon={<Pin size={14} />}
                  registration={register("city")}
                  value={cityValue}
                  error={errors.city?.message}
                  suggest={(text, signal) => suggestPlaces(text, near, signal, "city")}
                  onPick={pickCity}
                />

                {/* State: the US states, from a list; ZIP: suggests postal codes */}
                <div className="grid grid-cols-2 gap-2.5">
                  <SuggestField
                    label="State"
                    id="state"
                    placeholder="FL"
                    icon={<Map2 size={14} />}
                    registration={register("state")}
                    value={stateValue}
                    error={errors.state?.message}
                    suggest={async (text) =>
                      searchUsStates(text).map((state) => ({
                        id: state.code,
                        main: state.code,
                        secondary: state.name,
                      }))
                    }
                    onPick={(state) =>
                      setValue("state", state.id, { shouldDirty: true, shouldValidate: true })
                    }
                    minLetters={1}
                    debounceMs={0}
                    placement="above"
                  />

                  <SuggestField
                    label="ZIP Code"
                    id="zip"
                    placeholder="33301"
                    icon={<Map2 size={14} />}
                    registration={register("zip")}
                    value={zipValue}
                    error={errors.zip?.message}
                    suggest={(text, signal) => suggestPlaces(text, near, signal, "postalCode")}
                    onPick={pickZip}
                    placement="above"
                  />
                </div>
              </div>
            </fieldset>
            </div>

            {/* Save; always in view */}
            <div className="shrink-0 px-5 pb-5 pt-3">
            <button
              type="submit"
              // Not while the pin's address is still being filled in
              disabled={saving || finding}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#111827] text-xs font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-80"
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
            </div>
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
        className="mb-1 block text-[10px] font-semibold text-gray-600"
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
