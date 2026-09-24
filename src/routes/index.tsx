import { RequireAuth } from "@/components/auth/RequireAuth";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { Account } from "@/pages/Account";
import { AdminBookings } from "@/pages/AdminBookings";
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
    // Customer dashboard: any logged-in account, admins included
    path: "dashboard",
    element: (
      <RequireAuth>
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
    ],
  },
]);

export default Router;
