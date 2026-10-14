import { NavLink } from "react-router";
import { cn } from "@/libs/utils";
import { Logo } from "@/components/ui/Logo";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin, selectIsAuthenticated } from "@/redux/auth/authSlice";
import { NotificationDropdown } from "./Notification/NotificationDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
import { adminNavigation, customerNavigation, exactPaths, type NavItem } from "./navigation";

export function Navbar() {
  const isAdmin = useAppSelector(selectIsAdmin);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <header className="h-[60px] border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between gap-4 px-6">

        <Logo />

        {/* Page links for the logged-in role (there is no sidebar) */}
        <NavLinks items={isAdmin ? adminNavigation : customerNavigation} />

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

// Icons only on small screens, icon + label from md up
function NavLinks({ items }: { items: NavItem[] }) {
  return (
    <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto md:justify-center">
      {items.map(({ label, path, icon: Icon }) => (
        <NavLink
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
          <Icon size={18} strokeWidth={2} />
          <span className="hidden md:inline">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
