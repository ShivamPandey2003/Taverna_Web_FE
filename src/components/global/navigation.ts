import { HomeSmile, Calendar, Tag, UserCircle, ClipboardList, Building, Car, Users } from "reicon-react";

export interface NavItem {
  label: string;
  path: string;
  icon: typeof HomeSmile;
}

// Customers: shown in the Sidebar
export const customerNavigation: NavItem[] = [
  { label: "Home", path: "/dashboard", icon: HomeSmile },
  { label: "Book Service", path: "/dashboard/book-service", icon: Calendar },
  { label: "Specials", path: "/dashboard/specials", icon: Tag },
  { label: "Account", path: "/dashboard/account", icon: UserCircle },
];

// Admins: shown in the Navbar (admins have no sidebar)
export const adminNavigation: NavItem[] = [
  { label: "Bookings", path: "/admin", icon: ClipboardList },
  { label: "Dealerships", path: "/admin/dealerships", icon: Building },
  { label: "Valets", path: "/admin/valets", icon: Car },
  { label: "Advisors", path: "/admin/advisors", icon: Users },
];

// Paths that must match exactly so child routes don't also highlight them
export const exactPaths = ["/dashboard", "/admin"];
