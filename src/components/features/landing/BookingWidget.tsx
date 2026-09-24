import { useLocation } from "@/hooks/useLocation";
import { useEffect } from "react";
import { XCircle } from "reicon-react";
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

  return (
    <div className="space-y-3 relative">
      {/* Pickup */}
      <div className="flex items-center gap-3 rounded-lg border border-gray-300 px-4 py-3">
        <div className="h-6 w-6 rounded-full border-2 border-black flex items-center justify-center">
          <div className="bg-black h-3.5 w-3.5 rounded-full"></div>
        </div>

        <div className="flex-1 text-sm line-clamp-1">
          Pickup from{" "}
          {loading ? (
            <strong>Getting location...</strong>
          ) : error ? (
            <strong>{error}</strong>
          ) : (
            // 540 SW 14th Ave, Fort Lauderdale, FL 33312, USA
            <strong>{address}</strong>
          )}
        </div>

        <button className="text-gray-500">
          <XCircle size={20} />
        </button>
      </div>
      <div className="h-16 absolute border-r-6 border-black top-1/6 left-6.5" />
      {/* Delivery */}
      <div className="flex items-center gap-3 rounded-lg border border-gray-300 px-4 py-3">
        <div className="h-6 w-6 rounded-sm bg-black" />

        <div className="flex-1 text-sm line-clamp-1">
          Deliver to <strong>Taverna Dealership, Fort Lauderdale</strong>
        </div>

        <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-primary">
          Closest
        </span>

        <button className="text-gray-500">
          <XCircle size={20} />
        </button>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={startBooking} className="cursor-pointer rounded-button border border-gray-400 px-4 py-3 text-sm font-semibold">
          Schedule for later
        </button>

        <button onClick={startBooking} className="cursor-pointer rounded-button bg-black px-4 py-3 text-sm font-semibold text-white">
          Confirm booking →
        </button>
      </div>
    </div>
  );
}
