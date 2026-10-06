import { Outlet, useMatch } from "react-router";
import { WifiOff } from "reicon-react";
import { valetTrip } from "@/components/features/admin/admin.utils";
import { isValetLeg } from "@/components/features/staffPortal/shared/workflow";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/libs/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useStaffBooking } from "@/services/queries/staffQueries";

// Who the open link is for: the trip's valet or the booking's advisor.
// Shares the page's booking query, so it costs no extra request.
function useStaffName() {
  const valetMatch = useMatch("/valet/:leg/:bookingId/:token");
  const advisorMatch = useMatch("/advisor/:bookingId/:token");
  const params = valetMatch?.params ?? advisorMatch?.params;
  const { data: booking } = useStaffBooking({
    id: params?.bookingId ?? "",
    token: params?.token ?? "",
  });

  if (!booking) return null;
  if (advisorMatch) return booking.relationshipManager?.name ?? null;
  const leg = valetMatch?.params.leg;
  return isValetLeg(leg) ? (valetTrip(booking, leg).valet?.name ?? null) : null;
}

// Chrome of the valet / advisor pages: brand bar (with the staff member's name)
// and an offline warning. `staff-app` switches on the staff theme (see index.css).
export function StaffLayout() {
  const online = useOnlineStatus();
  const staffName = useStaffName();
  const wide = !!useMatch("/advisor/:bookingId/:token");

  return (
    <div className={cn("staff-app min-h-dvh bg-section text-text", wide && "staff-wide")}>
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[var(--staff-width)] items-center justify-between gap-3 px-4">
          <Logo />
          <span className="chip chip-muted min-w-0">
            <span className="truncate">{staffName ?? "Staff"}</span>
          </span>
        </div>

        {!online && (
          <div
            role="status"
            className="flex items-center justify-center gap-2 bg-status-pending px-4 py-2 text-sm font-semibold text-white"
          >
            <WifiOff size={16} />
            You're offline. Updates will send once you reconnect.
          </div>
        )}
      </header>

      <Outlet />
    </div>
  );
}
