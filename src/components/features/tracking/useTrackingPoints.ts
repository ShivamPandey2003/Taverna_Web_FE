import { useQuery } from "@tanstack/react-query";
import { toLatLng, type LatLng } from "@/libs/maps";
import { useAppSelector } from "@/redux/hooks";
import { selectAddresses } from "@/redux/address/addressSlice";
import { locateText } from "@/services/geocodeApi";
import { useAllDealerships } from "@/services/queries/dealershipQueries";
import type { Address } from "@/types/address";
import type { Booking, CustomerBookingDetails } from "@/types/booking";

const normalise = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");
const sameText = (a: string, b: string) => normalise(a) === normalise(b);

interface TrackingPoints {
  pickup: LatLng | null;
  dealership: LatLng | null;
  // True once the pickup address has been looked for and couldn't be placed
  pickupMissing: boolean;
}

// Where the tracking map's two markers go: the pickup address the customer
// chose and the dealership. Each is null until it's known.
export function useTrackingPoints(
  booking: Booking,
  details: CustomerBookingDetails | undefined,
): TrackingPoints {
  const addresses = useAppSelector(selectAddresses);
  const dealerships = useAllDealerships();

  // The dealership: the booking's copy, or (on a booking restored after a reload,
  // which only has the name) the one of that name in the list
  const dealershipName = details?.dealershipName ?? booking.dealership.name;
  const listed = dealerships.data?.find((item) => sameText(item.name, dealershipName));
  const dealership =
    toLatLng(booking.dealership.latitude, booking.dealership.longitude) ??
    toLatLng(listed?.latitude, listed?.longitude);

  // The pickup: the saved address it was booked with, which has its position.
  // Found from the booking's own copy, or (restored bookings have none) from the
  // address text the details give.
  const booked = "address" in booking.pickup ? booking.pickup : null;
  const pickupText = details?.pickupAddress?.trim() ?? "";
  const saved = booked ? findBooked(addresses, booked) : findInText(addresses, pickupText);
  const savedPickup = toLatLng(saved?.latitude, saved?.longitude);

  // Otherwise the address looked up from its text, once
  const lookupText =
    pickupText || (booked ? `${booked.address}, ${booked.city}, ${booked.state} ${booked.zip}` : "");
  const lookup = useQuery({
    queryKey: ["geocode", lookupText],
    queryFn: () => locateText(lookupText),
    enabled: !savedPickup && lookupText !== "",
    staleTime: Infinity,
    retry: false,
  });

  const pickup = savedPickup ?? toLatLng(lookup.data?.latitude, lookup.data?.longitude);

  return {
    pickup,
    dealership,
    // Nothing to look up once the details have loaded, or the lookup failed
    pickupMissing: !pickup && (lookup.isError || (details !== undefined && lookupText === "")),
  };
}

function findBooked(addresses: Address[], booked: Pick<Address, "address" | "zip">) {
  return addresses.find(
    (address) => sameText(address.address, booked.address) && sameText(address.zip, booked.zip),
  );
}

// The saved address whose street (and ZIP, when it has one) appear in the text;
// when several do, the longest street (the most specific) wins
function findInText(addresses: Address[], text: string) {
  const haystack = normalise(text);
  if (!haystack) return undefined;

  return addresses
    .filter((address) => {
      const street = normalise(address.address);
      const zip = normalise(address.zip);
      return street !== "" && haystack.includes(street) && (zip === "" || haystack.includes(zip));
    })
    .sort((a, b) => b.address.length - a.address.length)[0];
}
