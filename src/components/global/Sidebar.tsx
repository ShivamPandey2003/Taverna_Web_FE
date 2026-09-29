import { NavLink } from "react-router";
import { ServiceStatusCard } from "@/components/features/tracking/ServiceStatusCard";
import { customerNavigation, exactPaths, type NavItem } from "./navigation";

// Customers only; admins get their links in the Navbar
export function Sidebar() {
  return (
    <aside className="hidden min-h-[calc(100vh-72px)] w-[260px] shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">

      <nav className="flex-1 space-y-2 p-6">

        {customerNavigation.map((item) => (
          <SidebarLink key={item.path} {...item} />
        ))}

      </nav>

      {/* The customer's running service; closable only once it's complete */}
      <div className="px-6 pb-4">
        <ServiceStatusCard />
      </div>

    </aside>
  );
}

function SidebarLink({ label, path, icon: Icon }: NavItem) {
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
