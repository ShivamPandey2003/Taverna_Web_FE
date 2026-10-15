import { useQuery } from "@tanstack/react-query";
import { toLatLng, type LatLng } from "@/libs/maps";
import { useAppSelector } from "@/redux/hooks";
import { selectAddresses } from "@/redux/address/addressSlice";
import { geocodeText } from "@/services/geocodeApi";
import { useAllDealerships } from "@/services/queries/dealershipQueries";
import type { Booking, CustomerBookingDetails } from "@/types/booking";

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Where the tracking map's two markers go: the pickup address the customer
// chose and the dealership. Each is null until it's known.
export function useTrackingPoints(
  booking: Booking,
  details: CustomerBookingDetails | undefined,
): { pickup: LatLng | null; dealership: LatLng | null } {
  const addresses = useAppSelector(selectAddresses);
  const dealerships = useAllDealerships();

  // The dealership: the booking's copy, or (on a booking restored after a reload,
  // which only has the name) the one of that name in the list
  const dealershipName = details?.dealershipName ?? booking.dealership.name;
  const listed = dealerships.data?.find((item) => sameText(item.name, dealershipName));
  const dealership =
    toLatLng(booking.dealership.latitude, booking.dealership.longitude) ??
    toLatLng(listed?.latitude, listed?.longitude);

  // The pickup: the saved address it was booked with, which has its position
  const booked = "address" in booking.pickup ? booking.pickup : null;
  const saved = booked
    ? addresses.find(
        (address) => sameText(address.address, booked.address) && sameText(address.zip, booked.zip),
      )
    : undefined;
  const savedPickup = toLatLng(saved?.latitude, saved?.longitude);

  // Otherwise the address the booking's details give, looked up once
  const pickupText =
    details?.pickupAddress?.trim() ||
    (booked ? `${booked.address}, ${booked.city}, ${booked.state} ${booked.zip}` : "");
  const lookup = useQuery({
    queryKey: ["geocode", pickupText],
    queryFn: () => geocodeText(pickupText),
    enabled: !savedPickup && pickupText !== "",
    staleTime: Infinity,
    retry: false,
  });

  return {
    pickup: savedPickup ?? toLatLng(lookup.data?.latitude, lookup.data?.longitude),
    dealership,
  };
}
