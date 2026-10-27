import type { ReactNode } from "react";
import { CheckCircle, Danger, InfoCircle } from "reicon-react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { TRACKING_PATH, trackingPath } from "@/components/features/tracking/serviceStatus";
import { statusName } from "@/services/bookingApi";
import { usePaymentSession } from "@/services/queries/bookingQueries";
import { formatPickupTime } from "@/libs/utils";

const formatMoney = (amount: number, currency: string) => {
  try {
    return amount.toLocaleString("en-US", { style: "currency", currency });
  } catch {
    // A currency code the browser doesn't know
    return `${amount.toFixed(2)} ${currency}`;
  }
};

// Where Stripe's checkout sends the customer back once they've paid. The page
// asks the API about Stripe's `session_id` (payments/session-details): paid, the
// payment's details and the API's own message; while it's still settling
// (`canRefresh`) it says so and asks again. Back to Booking opens the booking
// the payment was for.
export function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { data: session, isPending, isError, refetch, isFetching } = usePaymentSession(sessionId);

  const backTo = session?.bookingId ? trackingPath(session.bookingId) : TRACKING_PATH;
  const backButton = (
    <button
      data-test-id="payment-success-back"
      type="button"
      onClick={() => navigate(backTo)}
      className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
    >
      Back to Booking
    </button>
  );

  // Nothing to check without Stripe's session: back to the customer's home
  if (!sessionId) {
    return <Navigate to="/dashboard" replace />;
  }

  // The API couldn't find the session
  if (isError) {
    return (
      <PaymentState
        icon={<Danger size={48} className="text-status-pending" />}
        title="We Couldn't Check Your Payment"
        message="Your booking will show the payment once the dealership has it."
      >
        <button
          data-test-id="payment-success-retry"
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:opacity-60"
        >
          {isFetching ? "Checking..." : "Try Again"}
        </button>
        {backButton}
      </PaymentState>
    );
  }

  if (isPending) {
    return (
      <PaymentState
        icon={<Spinner />}
        title="Checking Your Payment"
        message="This takes a moment."
      />
    );
  }

  const paid = session.paymentStatus === "PAID";

  return (
    <PaymentState
      icon={
        paid ? (
          <CheckCircle size={48} className="text-status-active" />
        ) : session.canRefresh ? (
          <Spinner />
        ) : (
          <InfoCircle size={48} className="text-status-pending" />
        )
      }
      title={
        paid
          ? "Payment Successful"
          : session.canRefresh
            ? "Payment Processing"
            : "Payment Not Completed"
      }
      message={
        session.message ??
        (paid
          ? "Thank you! Your payment has been received. The dealership will confirm it shortly."
          : "We haven't received this payment yet.")
      }
      details={
        <dl className="w-full max-w-sm divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white px-4 text-left text-[13px]">
          <DetailRow label="Booking" value={`#${session.bookingId}`} />
          <DetailRow label="Amount" value={formatMoney(session.amount, session.currency)} />
          <DetailRow label="Payment" value={statusName(session.paymentStatus)} />
          {session.paidAt && <DetailRow label="Paid" value={formatPickupTime(session.paidAt)} />}
        </dl>
      }
    >
      {backButton}
    </PaymentState>
  );
}

function PaymentState({
  icon,
  title,
  message,
  details,
  children,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  details?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center overflow-auto bg-[#f8f9fa] px-6 py-8 text-center">
      {icon}

      <h1 className="mt-3 text-xl font-bold text-gray-900">{title}</h1>

      <p className="mt-2 max-w-sm text-sm text-gray-500">{message}</p>

      {details && <div className="mt-5 flex w-full justify-center">{details}</div>}

      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function Spinner() {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-status-active"
    />
  );
}
