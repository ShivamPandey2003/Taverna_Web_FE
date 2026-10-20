import { HomeSmile, Calendar, Tag, UserCircle, ClipboardList, Building, Car, Users } from "reicon-react";

export interface NavItem {
  label: string;
  path: string;
  icon: typeof HomeSmile;
}

// Gets a dot in the Navbar while there are new specials
export const SPECIALS_PATH = "/dashboard/specials";

// Customers: shown in the Navbar
export const customerNavigation: NavItem[] = [
  { label: "Home", path: "/dashboard", icon: HomeSmile },
  { label: "Book Service", path: "/dashboard/book-service", icon: Calendar },
  { label: "Specials", path: SPECIALS_PATH, icon: Tag },
  { label: "Account", path: "/dashboard/account", icon: UserCircle },
];

// Admins: shown in the Navbar
export const adminNavigation: NavItem[] = [
  { label: "Bookings", path: "/admin", icon: ClipboardList },
  { label: "Dealerships", path: "/admin/dealerships", icon: Building },
  { label: "Valets", path: "/admin/valets", icon: Car },
  { label: "Advisors", path: "/admin/advisors", icon: Users },
  { label: "Offers", path: "/admin/offers", icon: Tag },
];

// Paths that must match exactly so child routes don't also highlight them
export const exactPaths = ["/dashboard", "/admin"];
