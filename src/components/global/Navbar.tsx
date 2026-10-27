import { NavLink } from "react-router";
import { cn } from "@/libs/utils";
import { Logo } from "@/components/ui/Logo";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin, selectIsAuthenticated } from "@/redux/auth/authSlice";
import { NotificationDropdown } from "./Notification/NotificationDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
import { useProfile } from "@/services/queries/profileQueries";
import {
  adminNavigation,
  customerNavigation,
  exactPaths,
  SPECIALS_PATH,
  type NavItem,
} from "./navigation";

export function Navbar() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { items, dotPaths } = useNavItems();

  return (
    <header className="h-[60px] border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">

        <Logo />

        {/* Page links for the logged-in role (there is no sidebar); on phones
            they're in MobileNav at the bottom of the screen instead */}
        <NavLinks items={items} dotPaths={dotPaths} />

        {/* Right side */}
        <div className="flex items-center gap-5">

          {/* Notifications: anyone signed in (user/notifications) */}
          {isAuthenticated && <NotificationDropdown />}

          {/* Profile and log out */}
          <ProfileDropdown />

        </div>
      </div>
    </header>
  );
}

// The links for the logged-in role. Customers: a dot on Specials while there
// are offers they haven't seen.
function useNavItems() {
  const isAdmin = useAppSelector(selectIsAdmin);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data: profile } = useProfile(isAuthenticated && !isAdmin);
  return {
    items: isAdmin ? adminNavigation : customerNavigation,
    dotPaths: !isAdmin && profile?.hasNewSpecials ? [SPECIALS_PATH] : [],
  };
}

// A green dot over a link's icon
function NewDot() {
  return (
    <span
      className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"
      aria-label="New"
    />
  );
}

// From md up, in the header: icon + label. `dotPaths` get a green dot over their icon.
function NavLinks({ items, dotPaths }: { items: NavItem[]; dotPaths: string[] }) {
  return (
    <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
      {items.map(({ label, path, icon: Icon }) => (
        <NavLink
          data-test-id={`nav-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
          key={path}
          to={path}
          end={exactPaths.includes(path)}
          title={label}
          className={({ isActive }) =>
            cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
              isActive ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100",
            )
          }
        >
          <span className="relative">
            <Icon size={18} strokeWidth={2} />
            {dotPaths.includes(path) && <NewDot />}
          </span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

// Below md: a tab bar along the bottom of the screen with the same links, each
// an icon over a short label. A flex item under the page (not fixed), so pages
// end above it; it keeps clear of the phone's home indicator.
export function MobileNav() {
  const { items, dotPaths } = useNavItems();

  return (
    <nav className="flex shrink-0 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      {items.map(({ label, path, icon: Icon }) => (
        <NavLink
          data-test-id={`mobile-nav-link-${label.toLowerCase().replace(/\s+/g, "-")}`}
          key={path}
          to={path}
          end={exactPaths.includes(path)}
          className={({ isActive }) =>
            cn(
              "flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
              isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-700",
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  "relative flex h-7 w-12 items-center justify-center rounded-full transition-colors",
                  isActive && "bg-black text-white",
                )}
              >
                <Icon size={18} strokeWidth={2} />
                {dotPaths.includes(path) && <NewDot />}
              </span>
              <span className="max-w-full truncate px-1">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
