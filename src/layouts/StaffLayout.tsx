import { Outlet, useMatch } from "react-router";
import { WifiOff } from "reicon-react";
import { StaffMenu } from "@/components/features/staffPortal/shared/StaffMenu";
import { useStaffAuth } from "@/components/features/staffPortal/shared/useStaffAuth";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/libs/utils";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useStaffTasks } from "@/services/queries/staffQueries";

// Who is signed in: the sign-in says so itself; one stored before it did is
// read off the first task of the task list's first page (the page's own query
// on page 1, and only asked for when the sign-in has no name).
function useStaffMember() {
  const onAdvisorTasks = !!useMatch("/advisor");
  const onValetTasks = !!useMatch("/valet");
  const { auth } = useStaffAuth();
  const needed = !auth.name && (onAdvisorTasks || onValetTasks);
  const { data } = useStaffTasks(
    onAdvisorTasks ? "advisor" : "valet",
    needed ? auth : { gear: "", token: "" },
    1,
  );

  if (auth.name) return { name: auth.name, email: auth.email ?? "" };
  return data?.tasks.find((task) => task.staff)?.staff ?? null;
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
