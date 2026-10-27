import { CheckCircle } from "reicon-react";
import { useNavigate, useSearchParams } from "react-router";
import { TRACKING_PATH, trackingPath } from "@/components/features/tracking/serviceStatus";

// Where Stripe's checkout sends the customer back once they've paid. The URL
// carries Stripe's `session_id` (not read: the API confirms the payment on its
// own) and the booking only if the API added it (`bmsId`); without it, Back to
// Booking opens the newest running booking, which shows the payment once the
// API has it.
export function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get("bmsId") ?? params.get("bookingId");

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-auto bg-[#f8f9fa] px-6 text-center">
      <CheckCircle size={48} className="text-status-active" />

      <h1 className="mt-3 text-xl font-bold text-gray-900">Payment Successful</h1>

      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Thank you! Your payment has been received. The dealership will confirm it shortly,
        and a valet can then bring your vehicle back.
      </p>

      <button
        data-test-id="payment-success-back"
        type="button"
        onClick={() => navigate(bookingId ? trackingPath(bookingId) : TRACKING_PATH)}
        className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Back to Booking
      </button>
    </div>
  );
}
