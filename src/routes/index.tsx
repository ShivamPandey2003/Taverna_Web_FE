import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { StaffLayout } from "@/layouts/StaffLayout";
import { Account } from "@/pages/Account";
import { AdminBookings } from "@/pages/AdminBookings";
import { AdminDealerships } from "@/pages/AdminDealerships";
import { AdminAdvisors } from "@/pages/AdminAdvisors";
import { AdminValets } from "@/pages/AdminValets";
import { AdvisorUpdate } from "@/pages/AdvisorUpdate";
import { BookService } from "@/pages/BookService";
import { Dashboard } from "@/pages/Dashboard";
import Home from "@/pages/Home";
import { PickupDelivery } from "@/pages/PickupDelivery";
import { Specials } from "@/pages/Specials";
import { ServiceTracking } from "@/pages/Tracking";
import { ValetUpdate } from "@/pages/ValetUpdate";
import { createBrowserRouter } from "react-router";

const Router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    // Customer dashboard: customers only; admins are sent to /admin
    path: "dashboard",
    element: (
      <RequireAuth role="user">
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "specials",
        element: <Specials />,
      },
      {
        path:"book-service",
        element:<BookService/>
      },
      {
        path:"book-service/review",
        element:<PickupDelivery/>
      },
      {
        path:"book-service/tracking",
        element:<ServiceTracking/>
      },
      {
        path:"account",
        element:<Account/>
      },
    ],
  },
  {
    // Admin dashboard: admins only
    path: "admin",
    element: (
      <RequireAuth role="admin">
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <AdminBookings />,
      },
      {
        path: "dealerships",
        element: <AdminDealerships />,
      },
      {
        path: "valets",
        element: <AdminValets />,
      },
      {
        path: "advisors",
        element: <AdminAdvisors />,
      },
    ],
  },
  {
    // Valet / advisor pages, opened from the link the admin shares (staffLink in
    // admin.utils.ts). No login: the token at the end of the path signs them in.
    element: <StaffLayout />,
    children: [
      {
        path: "valet/:leg/:bookingId/:token",
        element: <ValetUpdate />,
      },
      {
        path: "advisor/:bookingId/:token",
        element: <AdvisorUpdate />,
      },
    ],
  },
]);

export default Router;
