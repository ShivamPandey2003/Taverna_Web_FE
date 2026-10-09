import { useLocation } from "@/hooks/useLocation";
import { useEffect } from "react";
// import { XCircle } from "reicon-react";
import { useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectIsAuthenticated, setAuthMode } from "@/redux/auth/authSlice";
import { openAuthModal } from "@/redux/modals/homeModal/homeModalSlice";

export function BookingWidget() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { address, loading, error, getLocation } = useLocation();

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

  // The pickup address is the device's location: nothing can be booked without it
  const hasPickup = !loading && !error && !!address;
  // The delivery row shows while the location is being found too, as the pickup
  // row does; it only stays away when there's no pickup address to be close to
  const showDelivery = loading || hasPickup;

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

          {/* On phones the label has its own line and the address starts on the
              next (two lines at most); from sm up it's all one line */}
          <div className="min-w-0 flex-1 text-sm sm:flex sm:gap-1">
            <span className="block shrink-0">Pickup from</span>

            <strong className="line-clamp-2 min-w-0 break-words sm:line-clamp-1">
              {loading
                ? "Getting location..."
                : // 540 SW 14th Ave, Fort Lauderdale, FL 33312, USA
                  (error ?? address)}
            </strong>
          </div>

          {/* <button className="shrink-0 text-gray-500">
            <XCircle size={20} />
          </button> */}
        </div>

        {/* Delivery: the dealership closest to the pickup address */}
        {showDelivery && (
          <div className="relative flex items-center gap-3 rounded-lg border border-gray-300 px-4 py-3">
            {/* The line's other half, up from this marker's centre */}
            <div className="absolute -top-[13px] bottom-1/2 left-[26px] w-1 bg-black" />

            <div className="relative h-6 w-6 shrink-0 rounded-sm bg-black" />

            {/* Same as the pickup row, with the badge beside the dealership's name */}
            <div className="min-w-0 flex-1 text-sm sm:flex sm:items-center sm:gap-1">
              <span className="block shrink-0">Deliver to</span>

              <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:gap-3">
                <strong className="line-clamp-2 min-w-0 break-words sm:line-clamp-1 sm:flex-1">
                  {loading ? "Finding closest dealership..." : "Taverna Dealership, Fort Lauderdale"}
                </strong>

                {!loading && (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-primary">
                    Closest
                  </span>
                )}
              </div>
            </div>

            {/* <button className="shrink-0 text-gray-500">
              <XCircle size={20} />
            </button> */}
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
