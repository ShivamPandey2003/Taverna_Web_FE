import { Call, Copy, Routing } from "reicon-react";
import { cn, directionsLink, telLink } from "@/libs/utils";
import { staffToast } from "../shared/staffToast";

interface Stop {
  label: string;
  address: string;
  // Only the customer's stop has a number to call
  phone?: string;
}

interface RouteCardProps {
  from: Stop;
  to: Stop;
  // Which stop the valet is heading to right now, if any
  heading: "from" | "to" | null;
}

// Where the trip starts and ends, each with one-tap directions; the customer's
// stop also carries their number to copy or call
export function RouteCard({ from, to, heading }: RouteCardProps) {
  return (
    <section className="card">
      <p className="eyebrow">Route</p>
      <ol className="mt-3">
        <RouteStop kind="from" title="Pick up from" stop={from} active={heading === "from"} />
        <RouteStop kind="to" title="Drop off at" stop={to} active={heading === "to"} />
      </ol>
    </section>
  );
}

function RouteStop({
  kind,
  title,
  stop,
  active,
}: {
  kind: "from" | "to";
  title: string;
  stop: Stop;
  active: boolean;
}) {
  const { phone } = stop;

  const copyPhone = async () => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      staffToast.success("Number copied");
    } catch {
      staffToast.error("Couldn't copy the number");
    }
  };

  return (
    <li className="relative flex items-start gap-3 pb-4 last:pb-0">
      {kind === "from" && (
        <span aria-hidden className="absolute bottom-0 left-[9px] top-6 border-l-2 border-dashed border-border" />
      )}
      <span
        aria-hidden
        className={cn(
          "relative z-10 mt-1 h-5 w-5 shrink-0 rounded-full border-[5px] bg-white",
          kind === "from" ? "border-text" : "border-primary",
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="info-label flex items-center gap-2">
              {title}
              {active && <span className="chip chip-pending py-0.5">Heading here</span>}
            </p>
            <p className="info-value">{stop.label}</p>
            <p className="muted">{stop.address}</p>
          </div>

          <a
            data-test-id={`route-directions-${stop.label.toLowerCase().replace(/\s+/g, "-")}`}
            href={directionsLink(stop.address)}
            target="_blank"
            rel="noreferrer"
            className={cn("icon-btn", active && "icon-btn-primary")}
            aria-label={`Directions to ${stop.label}`}
          >
            <Routing size={20} />
          </a>
        </div>

        {phone && (
          <div className="mt-3 flex items-center gap-3">
            <button
              data-test-id={`route-copy-phone-${stop.label.toLowerCase().replace(/\s+/g, "-")}`}
              type="button"
              onClick={copyPhone}
              className="btn btn-secondary min-w-0 flex-1 justify-between rounded-full"
              aria-label={`Copy ${stop.label}'s number, ${phone}`}
            >
              <span className="truncate">{phone}</span>
              <Copy size={18} className="shrink-0 text-text-secondary" />
            </button>
            <a
              data-test-id={`route-call-${stop.label.toLowerCase().replace(/\s+/g, "-")}`}
              href={telLink(phone)}
              className="icon-btn icon-btn-primary"
              aria-label={`Call ${stop.label}`}
            >
              <Call size={20} />
            </a>
          </div>
        )}
      </div>
    </li>
  );
}
