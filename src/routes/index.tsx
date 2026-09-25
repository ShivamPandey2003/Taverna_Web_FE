import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Account } from "@/pages/Account";
import { AdminBookings } from "@/pages/AdminBookings";
import { AdminDealerships } from "@/pages/AdminDealerships";
import { AdminRelationshipManagers } from "@/pages/AdminRelationshipManagers";
import { AdminValets } from "@/pages/AdminValets";
import { BookService } from "@/pages/BookService";
import { Dashboard } from "@/pages/Dashboard";
import Home from "@/pages/Home";
import { PickupDelivery } from "@/pages/PickupDelivery";
import { Specials } from "@/pages/Specials";
import { ServiceTracking } from "@/pages/Tracking";
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
        path: "relationship-managers",
        element: <AdminRelationshipManagers />,
      },
    ],
  },
]);

export default Router;
