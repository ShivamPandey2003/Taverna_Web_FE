import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/hooks";
import { setPickupLocation, setSelectedDealership } from "@/redux/booking/bookingSlice";
import { distanceMiles } from "@/services/dealershipApi";
import { reverseGeocode, type AddressPlace } from "@/services/geocodeApi";
import { pendingBookingStorage, type PendingBooking } from "@/services/pendingBookingStorage";
import { useAddresses, useCreateAddress } from "@/services/queries/addressQueries";
import type { Address } from "@/types/address";

// A saved address this close to the landing page's pickup is taken to be it
const SAME_PLACE_MILES = 0.1;

const sameText = (a: string | undefined, b: string | undefined) =>
  !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

// The customer's saved address that is the landing page's pickup: the one it was
// saved as, else one at the same street and ZIP, else one right next to it
function findSaved(addresses: Address[], pending: PendingBooking) {
  const { pickup } = pending;
  return (
    addresses.find((address) => address.id === pending.addressId) ??
    addresses.find(
      (address) =>
        !!pickup.parts &&
        sameText(address.address, pickup.parts.address) &&
        sameText(address.zip, pickup.parts.zip),
    ) ??
    addresses.find(
      (address) =>
        address.latitude != null &&
        address.longitude != null &&
        distanceMiles(pickup, { latitude: address.latitude, longitude: address.longitude }) <
          SAME_PLACE_MILES,
    )
  );
}

// The street / city / state / ZIP a new address needs: what the landing page
// knew, else looked up from the position. null when the lookup fails or finds
// no street.
async function placeOf(pending: PendingBooking): Promise<AddressPlace | null> {
  if (pending.pickup.parts?.address && pending.pickup.parts.city) return pending.pickup.parts;
  try {
    const place = await reverseGeocode(pending.pickup.latitude, pending.pickup.longitude);
    return place.address && place.city ? place : null;
  } catch {
    return null;
  }
}

// On the dashboard (customers only): what the visitor chose on the landing page
// before signing in becomes the booking's starting point. The dealership is
// selected straight away. The pickup becomes a saved address (a booking needs
// one): an existing one when it matches, else it's saved as a new one, and is
// selected as the pickup. Runs once per visit to the dashboard; the choice is
// kept (with the address it became) until a booking is placed or the customer
// logs out, so a reload starts from it again.
export function usePendingBooking(enabled: boolean) {
  const dispatch = useAppDispatch();
  const { data: addresses } = useAddresses(enabled);
  const createAddress = useCreateAddress();
  const dealershipApplied = useRef(false);
  const pickupApplied = useRef(false);

  // The dealership needs nothing loaded first
  useEffect(() => {
    if (!enabled || dealershipApplied.current) return;
    dealershipApplied.current = true;
    const pending = pendingBookingStorage.read();
    if (pending?.dealership) dispatch(setSelectedDealership(pending.dealership));
  }, [enabled, dispatch]);

  // The pickup waits for the saved addresses, to match against them
  useEffect(() => {
    if (!enabled || !addresses || pickupApplied.current) return;
    pickupApplied.current = true;
    const pending = pendingBookingStorage.read();
    if (!pending) return;

    const select = (addressId: string) => {
      pendingBookingStorage.setAddressId(addressId);
      dispatch(setPickupLocation({ type: "saved", addressId }));
    };

    const saved = findSaved(addresses, pending);
    if (saved) {
      select(saved.id);
      return;
    }

    void (async () => {
      const place = await placeOf(pending);
      if (!place) {
        toast.info("We couldn't save your pickup address. Pick it on the booking page.");
        return;
      }
      try {
        const address = await createAddress.mutateAsync({
          type: "other",
          address: place.address,
          apartment: "",
          city: place.city,
          state: place.state,
          zip: place.zip,
          latitude: pending.pickup.latitude,
          longitude: pending.pickup.longitude,
          // The customer's first address becomes their default
          isDefault: addresses.length === 0,
        });
        select(address.id);
      } catch {
        // The API layer has toasted it; the booking page still lets them pick one
      }
    })();
    // createAddress is a new object each render; this runs once per visit anyway
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, addresses, dispatch]);
}
