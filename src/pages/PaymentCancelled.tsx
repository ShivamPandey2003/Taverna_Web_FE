import { useNavigate, useSearchParams } from "react-router";
import { TRACKING_PATH, trackingPath } from "@/components/features/tracking/serviceStatus";
import { usePayInvoice } from "@/services/queries/bookingQueries";

// Where Stripe's checkout sends the customer back when they cancel it. The
// booking is read from the URL if the API added it (`bmsId`); without it, Back
// to Booking opens the newest running booking and there is no Try Again.
export function PaymentCancelled() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get("bmsId") ?? params.get("bookingId");
  const payInvoice = usePayInvoice();
  // Still locked once the checkout is ready, while the browser leaves for it
  const redirecting = payInvoice.isPending || payInvoice.isSuccess;

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-auto bg-[#f8f9fa] px-6 text-center">
      <h1 className="text-xl font-bold text-gray-900">Payment Cancelled</h1>

      <p className="mt-2 max-w-sm text-sm text-gray-500">
        You haven't been charged. Your bill is still waiting on your booking, and you can pay
        it whenever you're ready.
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          data-test-id="payment-cancelled-back"
          type="button"
          onClick={() => navigate(bookingId ? trackingPath(bookingId) : TRACKING_PATH)}
          className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
        >
          Back to Booking
        </button>

        {bookingId && (
          <button
            data-test-id="payment-cancelled-retry"
            type="button"
            onClick={() => payInvoice.mutate(bookingId)}
            disabled={redirecting}
            className="rounded-lg bg-status-active px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {redirecting ? "Opening Checkout..." : "Try Again"}
          </button>
        )}
      </div>
    </div>
  );
}
