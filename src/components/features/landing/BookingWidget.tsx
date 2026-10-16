import { useLocation } from "@/hooks/useLocation";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectIsAuthenticated, setAuthMode } from "@/redux/auth/authSlice";
import { openAuthModal } from "@/redux/modals/homeModal/homeModalSlice";
import { usePublicNearbyDealerships } from "@/services/queries/dealershipQueries";
import { DealershipPicker } from "./DealershipPicker";
import { PickupSearch, type PickedPlace } from "./PickupSearch";

export function BookingWidget() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { address, coordinates: device, loading, error, getLocation } = useLocation();
  // A place the visitor searched for instead of where the device is
  const [picked, setPicked] = useState<PickedPlace | null>(null);
  // A dealership the visitor chose over the closest one
  const [chosenDealershipId, setChosenDealershipId] = useState<string | null>(null);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  // Booking needs an account, so logged-out visitors start the login flow
  const startBooking = () => {
    if (isAuthenticated) {
      navigate("/dashboard/book-service");
      return;
    }
    dispatch(setAuthMode("login"));
    dispatch(openAuthModal());
  };

  // Nothing can be booked without a pickup: the searched place, else the device's
  const hasPickup = !!picked || (!loading && !error && !!address);
  const pickup =
    picked?.coordinates ??
    (hasPickup && device ? { latitude: device.latitude, longitude: device.longitude } : null);

  // The dealership closest to the pickup (the list comes back closest first).
  // The public list: visitors here usually aren't logged in.
  const { data: nearby, isLoading: findingDealership, isError } = usePublicNearbyDealerships(pickup);
  const closest = nearby?.[0];
  // The chosen one while it's still in the list (a new pickup can change it),
  // else the closest
  const dealership = nearby?.find((item) => item.id === chosenDealershipId) ?? closest;
  const finding = (!picked && loading) || findingDealership;

  // The delivery row shows while the location is being found too, as the pickup
  // row does; it only stays away when there's no pickup address to be close to
  const showDelivery = finding || hasPickup;

  const pickCurrentLocation = () => {
    setPicked(null);
    getLocation();
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {/* Pickup */}
        <div className="relative flex items-center gap-3 rounded-lg border border-gray-300 px-4 py-3">
          {/* Line down to the delivery marker: from this marker's centre across the
              gap, whatever height the address wraps to */}
          {showDelivery && <div className="absolute -bottom-[13px] left-[26px] top-1/2 w-1 bg-black" />}

          <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white">
            <div className="bg-black h-3.5 w-3.5 rounded-full"></div>
          </div>

          <PickupSearch
            value={picked?.label ?? (loading ? "" : (address ?? ""))}
            placeholder={
              loading ? "Getting location..." : error ? `${error} Search an address` : "Search pickup address"
            }
            near={pickup}
            onPick={setPicked}
            onUseCurrentLocation={pickCurrentLocation}
          />
        </div>

        {/* Delivery: the dealership closest to the pickup address, or the one chosen */}
        {showDelivery && (
          <div className="relative flex items-center gap-3 rounded-lg border border-gray-300 px-4 py-3">
            {/* The line's other half, up from this marker's centre */}
            <div className="absolute -top-[13px] bottom-1/2 left-[26px] w-1 bg-black" />

            <div className="relative h-6 w-6 shrink-0 rounded-sm bg-black" />

            {!finding && dealership && nearby ? (
              // The closest by default; a dropdown to pick another
              <DealershipPicker
                dealerships={nearby}
                selected={dealership}
                pickup={pickup}
                onSelect={(item) => setChosenDealershipId(item.id)}
              />
            ) : (
              <div className="min-w-0 flex-1 text-sm sm:flex sm:items-center sm:gap-1">
                <span className="block shrink-0">Deliver to</span>

                <strong className="line-clamp-2 min-w-0 break-words sm:line-clamp-1 sm:flex-1">
                  {finding
                    ? "Finding closest dealership..."
                    : isError
                      ? "We couldn't load the dealerships"
                      : "No dealership near this address"}
                </strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={startBooking}
          disabled={!hasPickup}
          className="cursor-pointer rounded-button border border-gray-400 px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Schedule for Later
        </button>

        <button
          onClick={startBooking}
          disabled={!hasPickup}
          className="cursor-pointer rounded-button bg-black px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Confirm Booking →
        </button>
      </div>
    </div>
  );
}
