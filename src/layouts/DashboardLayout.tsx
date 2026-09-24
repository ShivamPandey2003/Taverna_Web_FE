import { Outlet } from "react-router";

import { Navbar } from "@/components/global/Navbar";
import { Sidebar } from "@/components/global/Sidebar";

export function DashboardLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        {/* Page Content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}