import { NavLink } from "react-router";
import { cn } from "@/libs/utils";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin } from "@/redux/auth/authSlice";
import { NotificationDropdown } from "./Notification/NotificationDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
import { adminNavigation, customerNavigation, exactPaths, type NavItem } from "./navigation";

export function Navbar() {
  const isAdmin = useAppSelector(selectIsAdmin);

  return (
    <header className="h-[60px] border-b border-gray-200 bg-white">
      <div className="flex h-full items-center justify-between gap-4 px-6">

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <span className="font-serif text-4xl leading-none text-black">
              T
            </span>

            <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" />

            <span className="absolute bottom-1 left-1/2 h-0.5 w-5 -translate-x-1/2 bg-primary" />
          </div>

          <span className="text-2xl font-bold tracking-tight">
            Taverna
          </span>
        </div>

        {/* Page links for the logged-in role (there is no sidebar) */}
        <NavLinks items={isAdmin ? adminNavigation : customerNavigation} />

        {/* Right side */}
        <div className="flex items-center gap-5">

          {/* Notification */}
          {/* <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-700 transition hover:bg-gray-100"
          >
            <Bell size={20} strokeWidth={2} />
          </button> */}
          <NotificationDropdown/>

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
