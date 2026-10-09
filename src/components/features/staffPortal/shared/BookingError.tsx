import { AlertCircle, LinkBroken, Refresh2 } from "reicon-react";
import { StateScreen } from "@/components/ui/StateScreen";
import { errorMessage } from "@/libs/apiError";

// The booking couldn't be loaded: bad or expired sign-in, removed booking, or no
// signal. `onSignIn` drops the sign-in so the email + OTP form comes back.
export function BookingError({
  title = "Couldn't Open This Booking",
  error,
  onRetry,
  onSignIn,
}: {
  title?: string;
  error: unknown;
  onRetry: () => void;
  onSignIn: () => void;
}) {
  return (
    <div className="page-body">
      <StateScreen
        tone="danger"
        icon={<AlertCircle size={30} />}
        title={title}
        action={
          <div className="space-y-2">
            <button type="button" onClick={onRetry} className="btn btn-secondary btn-block">
              <Refresh2 size={18} />
              Try Again
            </button>
            <button type="button" onClick={onSignIn} className="btn btn-secondary btn-block">
              Sign In Again
            </button>
          </div>
        }
      >
        {errorMessage(error)}
      </StateScreen>
    </div>
  );
}

// The sign-in is for another page of this booking, e.g. a valet opening the
// advisor's page
export function WrongLink({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="page-body">
      <StateScreen
        tone="danger"
        icon={<LinkBroken size={30} />}
        title="This Link Isn't for This Page"
        action={
          <button type="button" onClick={onSignIn} className="btn btn-secondary btn-block">
            Sign In Again
          </button>
        }
      >
        Open the link the Taverna team sent you, exactly as you got it.
      </StateScreen>
    </div>
  );
}
