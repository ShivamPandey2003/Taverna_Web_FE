import { Outlet, useMatch } from "react-router";
import { WifiOff } from "reicon-react";
import { valetTrip } from "@/components/features/admin/admin.utils";
import { StaffMenu } from "@/components/features/staffPortal/shared/StaffMenu";
import { useStaffAuth } from "@/components/features/staffPortal/shared/useStaffAuth";
import { isValetLeg } from "@/components/features/staffPortal/shared/workflow";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/libs/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useStaffBooking, useStaffBookings } from "@/services/queries/staffQueries";
import type { StaffBooking, StaffLinkRole } from "@/types/admin";

// The booking's valet / advisor behind one of its pages
function staffOn(booking: StaffBooking, role: StaffLinkRole) {
  return role === "advisor" ? booking.relationshipManager : valetTrip(booking, role).valet;
}

// Who is signed in, read off what they're assigned to: the open booking's page,
// or on the task list their first task. Shares the pages' queries, so it costs
// no extra request. null when there's nothing to read it from.
function useStaffMember() {
  const valetMatch = useMatch("/valet/:leg/:bookingId");
  const advisorMatch = useMatch("/advisor/:bookingId");
  const params = valetMatch?.params ?? advisorMatch?.params;
  const { auth } = useStaffAuth();
  const { data: booking } = useStaffBooking({ id: params?.bookingId ?? "", ...auth });
  // Only fetched on the task list
  const { data: bookings } = useStaffBookings(params ? { gear: "", token: "" } : auth);

  if (booking) {
    if (advisorMatch) return staffOn(booking, "advisor");
    const leg = valetMatch?.params.leg;
    return isValetLeg(leg) ? staffOn(booking, leg) : null;
  }
  const first = bookings?.find((item) => item.linkRoles?.length);
  return first?.linkRoles ? staffOn(first, first.linkRoles[0]) : null;
}

// Chrome of the valet / advisor pages: brand bar (with the signed-in staff
// member's menu) and an offline warning. `staff-app` switches on the staff theme (see index.css).
export function StaffLayout() {
  const online = useOnlineStatus();
  const member = useStaffMember();
  const wide = !!useMatch("/advisor/:bookingId");
  // On a booking page: the way back to the task list, in the avatar menu
  const onValetPage = !!useMatch("/valet/:leg/:bookingId");
  const tasksPath = wide ? "/advisor" : onValetPage ? "/valet" : null;
  const { signedIn, signOut } = useStaffAuth();

  return (
    <div className={cn(
        "staff-app min-h-dvh bg-section text-text",
        wide && "staff-wide",
      )}>
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[var(--staff-width)] items-center justify-between gap-3 px-4">
          <Logo />
          {signedIn && <StaffMenu member={member} tasksPath={tasksPath} onSignOut={signOut} />}
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
