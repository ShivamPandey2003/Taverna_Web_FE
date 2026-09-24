import { useState } from "react";
import {
  Crosshairs,
  Pin,
  Plus,
  X,
} from "reicon-react";
import type { Address, AddressType } from "@/types/address";
import { useLocation } from "@/hooks/useLocation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAddresses } from "@/redux/address/addressSlice";
import {
  selectBooking,
  selectBookingAddress,
  setPickupLocation,
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
  const { pickupLocation } = useAppSelector(selectBooking);
  const bookingAddress = useAppSelector(selectBookingAddress);
  const {
    address: currentAddress,
    loading: locating,
    error: locationError,
    getLocation,
  } = useLocation();

  const [selectedType, setSelectedType] = useState<
    "current" | "saved"
  >(
    pickupLocation?.type ?? "saved"
  );

  const [selectedAddressId, setSelectedAddressId] =
    useState<string | null>(
      bookingAddress?.id ??
        addresses[0]?.id ??
        null
    );

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

  const handleConfirm = () => {
    if (selectedType === "current") {
      if (!currentAddress) {
        return;
      }

      dispatch(
        setPickupLocation({
          type: "current",
          label: currentAddress,
        })
      );
      onClose();

      return;
    }

    if (!selectedAddress) {
      return;
    }

    dispatch(
      setPickupLocation({
        type: "saved",
        addressId: selectedAddress.id,
      })
    );
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal wrapper */}
      <div className="relative flex min-h-full items-center justify-center overflow-y-auto p-6">
        {/* Modal */}
        <div
          className="relative w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          {/* Header */}
          <div className="flex items-center justify-between">
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
          <div className="mt-5 space-y-3">
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
                  Use current location
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

            {/* Add address */}
            <button
              type="button"
              onClick={onAddAddress}
              className="flex w-full items-center gap-4 rounded-xl border border-gray-200 px-3 py-2  text-left transition hover:border-gray-300 hover:bg-gray-50"
            >
              <LocationIcon>
                <Plus size={19} />
              </LocationIcon>

              <span className="text-sm font-bold text-gray-900">
                Add address
              </span>
            </button>
          </div>

          {/* Saved addresses */}
          <section className="mt-6">
            <h3 className="text-sm font-bold text-gray-900">
              Saved Addresses
            </h3>

            <div className="mt-3 space-y-3 min-h-0 h-[40vh] overflow-auto">
              {addresses.length === 0 && (
                <p className="text-sm text-gray-500">
                  No saved addresses yet.
                </p>
              )}
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
          <div className="my-5 h-px bg-gray-200" />

          {/* Actions */}
          <div className="flex justify-end gap-3">
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
                selectedType === "saved"
                  ? !selectedAddress
                  : !currentAddress
              }
              onClick={handleConfirm}
              className="h-10 rounded-lg bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

        <p className="mt-1 text-sm font-bold text-gray-900">
          {address.address}
        </p>

        <p className="mt-0.5 text-sm text-gray-500">
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