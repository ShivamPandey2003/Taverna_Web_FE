import { HomeSmile, Calendar, Tag, UserCircle, ClipboardList, Logout, Building, Car, Users } from 'reicon-react';

import { NavLink } from "react-router";
import { useAppSelector } from "@/redux/hooks";
import { selectIsAdmin } from "@/redux/auth/authSlice";
import { useLogout } from "@/hooks/useLogout";
import { ServiceStatusCard } from "@/components/features/tracking/ServiceStatusCard";

const navigation = [
  {
    label: "Home",
    path: "/dashboard",
    icon: HomeSmile,
  },
  {
    label: "Book Service",
    path: "/dashboard/book-service",
    icon: Calendar,
  },
  {
    label: "Specials",
    path: "/dashboard/specials",
    icon: Tag,
  },
  {
    label: "Account",
    path: "/dashboard/account",
    icon: UserCircle,
  },
];

const adminNavigation = [
  {
    label: "Bookings",
    path: "/admin",
    icon: ClipboardList,
  },
  {
    label: "Dealerships",
    path: "/admin/dealerships",
    icon: Building,
  },
  {
    label: "Valets",
    path: "/admin/valets",
    icon: Car,
  },
  {
    label: "Relationship Managers",
    path: "/admin/relationship-managers",
    icon: Users,
  },
];

// Paths that must match exactly so child routes don't also highlight them
const exactPaths = ["/dashboard", "/admin"];

export function Sidebar() {
  const isAdmin = useAppSelector(selectIsAdmin);
  const handleLogout = useLogout();

  return (
    <aside className="hidden min-h-[calc(100vh-72px)] w-[260px] shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">

      <nav className="flex-1 space-y-2 p-6">

        {/* Admins can't open customer pages, so they only get the admin links */}
        {(isAdmin ? adminNavigation : navigation).map((item) => (
          <SidebarLink key={item.path} {...item} />
        ))}

      </nav>

      {/* The customer's running service; can't be closed */}
      {!isAdmin && (
        <div className="px-6 pb-4">
          <ServiceStatusCard />
        </div>
      )}

      <div className="border-t border-gray-200 p-6">
        <button
          type="button"
          onClick={handleLogout}
          className="flex h-11 w-full items-center gap-4 rounded-lg px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <Logout size={20} strokeWidth={2} />
          <span>Log out</span>
        </button>
      </div>

    </aside>
  );
}

function SidebarLink({
  label,
  path,
  icon: Icon,
}: {
  label: string;
  path: string;
  icon: typeof HomeSmile;
}) {
  return (
    <NavLink
      to={path}
      end={exactPaths.includes(path)}
      className={({ isActive }) =>
        [
          "flex h-11 items-center gap-4 rounded-lg px-4",
          "text-sm font-medium transition-colors",
          isActive
            ? "bg-black text-white"
            : "text-gray-700 hover:bg-gray-100",
        ].join(" ")
      }
    >
      <Icon size={20} strokeWidth={2} />

      <span>{label}</span>
    </NavLink>
  );
}
