import { AlertCircle, LinkBroken, Refresh2 } from "reicon-react";
import { StateScreen } from "@/components/ui/StateScreen";
import { errorMessage } from "@/libs/apiError";

// The booking couldn't be loaded: wrong link, removed booking, or no signal
export function BookingError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="page-body">
      <StateScreen
        tone="danger"
        icon={<AlertCircle size={30} />}
        title="Couldn't Open This Booking"
        action={
          <button type="button" onClick={onRetry} className="btn btn-secondary btn-block">
            <Refresh2 size={18} />
            Try Again
          </button>
        }
      >
        {errorMessage(error)}
      </StateScreen>
    </div>
  );
}

// The token is for another page of this booking, e.g. a valet's link edited to
// open the advisor's page
export function WrongLink() {
  return (
    <div className="page-body">
      <StateScreen tone="danger" icon={<LinkBroken size={30} />} title="This Link Isn't for This Page">
        Open the link the Taverna team sent you, exactly as you got it.
      </StateScreen>
    </div>
  );
}
