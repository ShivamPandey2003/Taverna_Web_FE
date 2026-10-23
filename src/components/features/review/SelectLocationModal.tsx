import { useState } from "react";
import {
  Crosshairs,
  Pin,
  Plus,
  X,
} from "reicon-react";
import type { Address, AddressType } from "@/types/address";
import { SearchLocationRow, type SearchedPlace } from "./SearchLocationRow";
import { useLocation } from "@/hooks/useLocation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAddresses } from "@/redux/address/addressSlice";
import { useAddresses, useCreateAddress } from "@/services/queries/addressQueries";
import {
  selectBooking,
  selectBookingAddress,
  changePickupLocation,
} from "@/redux/booking/bookingSlice";

interface SelectLocationModalProps {
  open: boolean;
  onClose: () => void;
  onAddAddress?: () => void;
}

export function SelectLocationModal({
  open,
  onClose,
  onAddAddress,
}: SelectLocationModalProps) {
  if (!open) {
    return null;
  }

  return (
    <SelectLocationContent
      onClose={onClose}
      onAddAddress={onAddAddress}
    />
  );
}

function SelectLocationContent({
  onClose,
  onAddAddress,
}: Omit<SelectLocationModalProps, "open">) {
  const dispatch = useAppDispatch();
  const addresses = useAppSelector(selectAddresses);
  const {
    isPending: loadingAddresses,
    isError: addressesFailed,
    isFetching: fetchingAddresses,
    refetch: refetchAddresses,
  } = useAddresses();
  const { pickupLocation } = useAppSelector(selectBooking);
  const bookingAddress = useAppSelector(selectBookingAddress);
  const {
    address: currentAddress,
    parts: currentParts,
    coordinates,
    loading: locating,
    error: locationError,
    getLocation,
  } = useLocation();
  const createAddress = useCreateAddress();

  // "search": a place picked in the search box, saved as an address on confirm
  const [selectedType, setSelectedType] = useState<
    "current" | "search" | "saved"
  >(
    pickupLocation?.type ?? "saved"
  );

  const [selectedAddressId, setSelectedAddressId] =
    useState<string | null>(
      bookingAddress?.id ??
        addresses[0]?.id ??
        null
    );

  const [searched, setSearched] = useState<SearchedPlace | null>(null);

  const selectedAddress = addresses.find(
    (address) =>
      address.id === selectedAddressId
  );

  const selectCurrentLocation = () => {
    setSelectedType("current");

    if (!currentAddress && !locating) {
      getLocation();
    }
  };

  const currentLocationText = locating
    ? "Getting location..."
    : currentAddress ?? locationError ?? "Use your device location";

  const pickSaved = (addressId: string) => {
    dispatch(changePickupLocation({ type: "saved", addressId }));
    onClose();
  };

  // The current location or a searched place is saved as an address first
  // (user/addresses): a booking needs a saved address. One already saved with
  // the same street and ZIP is picked instead, so confirming again doesn't save
  // it twice.
  const saveAndPick = (
    parts: { address: string; city: string; state: string; zip: string },
    position: { latitude: number; longitude: number } | null,
  ) => {
    const saved = addresses.find(
      (address) =>
        sameText(address.address, parts.address) && sameText(address.zip, parts.zip),
    );
    if (saved) {
      pickSaved(saved.id);
      return;
    }

    createAddress.mutate(
      {
        type: "other",
        address: parts.address,
        apartment: "",
        city: parts.city,
        state: parts.state,
        zip: parts.zip,
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
        // The customer's first address becomes their default
        isDefault: addresses.length === 0,
      },
      // A failed save is toasted by the API layer; the modal stays open
      { onSuccess: (address) => pickSaved(address.id) },
    );
  };

  const handleConfirm = () => {
    if (selectedType === "current") {
      if (currentAddress && currentParts) saveAndPick(currentParts, coordinates ?? null);
      return;
    }

    if (selectedType === "search") {
      if (searched) saveAndPick(searched.place, searched.coordinates);
      return;
    }

    if (!selectedAddress) {
      return;
    }

    pickSaved(selectedAddress.id);
  };

  const saving = createAddress.isPending;

  return (
    // Over the window, not inside the page: the page behind never scrolls
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal wrapper */}
      <div className="pointer-events-none relative flex h-full items-center justify-center p-4 sm:p-6">
        {/* Modal: at most the window's height; only the saved addresses scroll,
            the options above and the buttons below stay in view */}
        <div
          className="pointer-events-auto relative flex max-h-full w-full max-w-[520px] flex-col rounded-2xl bg-white p-5 shadow-2xl"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#111827]">
              Select a Location
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          {/* Location options */}
          <div className="mt-4 shrink-0 space-y-2.5">
            {/* Current location */}
            <button
              type="button"
              onClick={selectCurrentLocation}
              className={[
                "flex w-full items-center gap-4 rounded-xl border px-3 py-2 text-left",
                "transition",
                selectedType === "current"
                  ? "border-gray-900"
                  : "border-gray-200 hover:border-gray-300",
              ].join(" ")}
            >
              <LocationIcon>
                <Crosshairs size={18} />
              </LocationIcon>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">
                  Use Current Location
                </p>

                <p className="line-clamp-1 text-sm text-gray-500">
                  {currentLocationText}
                </p>
              </div>

              <Radio
                selected={
                  selectedType === "current"
                }
              />
            </button>

            {/* Search: type an address and pick one of the suggestions */}
            <SearchLocationRow
              selected={selectedType === "search"}
              picked={searched}
              near={coordinates ?? (bookingAddress?.latitude != null && bookingAddress.longitude != null
                ? { latitude: bookingAddress.latitude, longitude: bookingAddress.longitude }
                : null)}
              onSelect={() => setSelectedType("search")}
              onPick={(place) => {
                setSelectedType("search");
                setSearched(place);
              }}
              disabled={saving}
            />

            {/* Add Address */}
            <button
              type="button"
              onClick={onAddAddress}
              className="flex w-full items-center gap-4 rounded-xl border border-gray-200 px-3 py-2  text-left transition hover:border-gray-300 hover:bg-gray-50"
            >
              <LocationIcon>
                <Plus size={19} />
              </LocationIcon>

              <span className="text-sm font-bold text-gray-900">
                Add Address
              </span>
            </button>
          </div>

          {/* Saved addresses */}
          <section className="mt-4 flex min-h-0 flex-1 flex-col">
            <h3 className="shrink-0 text-sm font-bold text-gray-900">
              Saved Addresses
            </h3>

            {/* At least two rows tall; grows with the screen up to the list's length */}
            <div className="-mx-1 mt-2.5 min-h-[150px] flex-1 space-y-2.5 overflow-y-auto px-1 py-0.5">
              {addresses.length === 0 &&
                (loadingAddresses ? (
                  // First load: placeholders the shape of the address rows
                  <div className="space-y-3" role="status" aria-label="Loading your addresses">
                    {[0, 1].map((item) => (
                      <div
                        key={item}
                        className="flex animate-pulse items-center gap-4 rounded-xl border border-gray-200 px-3 py-3"
                      >
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/2 rounded bg-gray-200" />
                          <div className="h-3 w-1/3 rounded bg-gray-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : addressesFailed ? (
                  <p className="text-sm text-gray-500">
                    We couldn't load your addresses.{" "}
                    <button
                      type="button"
                      onClick={() => refetchAddresses()}
                      disabled={fetchingAddresses}
                      className="font-semibold text-gray-900 underline underline-offset-4 disabled:opacity-50"
                    >
                      {fetchingAddresses ? "Retrying..." : "Try Again"}
                    </button>
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">
                    No saved addresses yet.
                  </p>
                ))}
              {addresses.map((address) => (
                <SavedAddressCard
                  key={address.id}
                  address={address}
                  selected={
                    selectedType === "saved" &&
                    selectedAddressId ===
                      address.id
                  }
                  onSelect={() => {
                    setSelectedType("saved");
                    setSelectedAddressId(
                      address.id
                    );
                  }}
                />
              ))}
            </div>
          </section>

          {/* Divider */}
          <div className="my-4 h-px shrink-0 bg-gray-200" />

          {/* Actions */}
          <div className="flex shrink-0 justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                saving ||
                (selectedType === "saved"
                  ? !selectedAddress
                  : selectedType === "search"
                    ? !searched
                    : !currentAddress || !currentParts)
              }
              onClick={handleConfirm}
              className="flex h-10 items-center gap-2 rounded-lg bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {saving ? "Saving Address..." : "Confirm Selection"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const sameText = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

interface SavedAddressCardProps {
  address: Address;
  selected: boolean;
  onSelect: () => void;
}

function SavedAddressCard({
  address,
  selected,
  onSelect,
}: SavedAddressCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-4 rounded-xl border px-3 py-2 text-left",
        "transition",
        selected
          ? "border-2 border-gray-900"
          : "border border-gray-200 hover:border-gray-300",
      ].join(" ")}
    >
      {/* Icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
        <Pin
          size={18}
          className="text-gray-600"
        />
      </div>

      {/* Address */}
      <div className="min-w-0 flex-1">
        <div>
          <AddressTypeBadge
            type={address.type}
          />
        </div>

        <p className="mt-0.5 text-sm font-bold text-gray-900">
          {address.address}
        </p>

        <p className="text-sm text-gray-500">
          {address.city}, {address.state}{" "}
          {address.zip}
        </p>
      </div>

      {/* Radio */}
      <Radio selected={selected} />
    </button>
  );
}

interface LocationIconProps {
  children: React.ReactNode;
}

function LocationIcon({
  children,
}: LocationIconProps) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-800">
      {children}
    </div>
  );
}

function Radio({
  selected,
}: {
  selected: boolean;
}) {
  return (
    <div
      className={[
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
        selected
          ? "border-gray-900"
          : "border-gray-300",
      ].join(" ")}
    >
      {selected && (
        <div className="h-2.5 w-2.5 rounded-full bg-gray-900" />
      )}
    </div>
  );
}

function AddressTypeBadge({
  type,
}: {
  type: AddressType;
}) {
  const styles = {
    home: "bg-gray-900 text-white",
    work: "bg-gray-900 text-white",
    other: "bg-gray-400 text-white",
  };

  return (
    <span
      className={[
        "inline-flex rounded-md px-2 py-0.5",
        "text-[10px] font-bold capitalize",
        styles[type],
      ].join(" ")}
    >
      {type}
    </span>
  );
}