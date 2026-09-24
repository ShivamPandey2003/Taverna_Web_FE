import { BookingsTable } from "@/components/features/admin/BookingsTable";
import { BookingsToolbar } from "@/components/features/admin/BookingsToolbar";
import { BookingWorkflowModal } from "@/components/features/admin/workflow/BookingWorkflowModal";

export function AdminBookings() {
  return (
    <main className="min-h-0 h-full overflow-auto bg-[#f8f9fa] px-6 py-4 lg:px-10">
      <div className="mx-auto space-y-3">
        {/* Page header */}
        <header className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Bookings
          </h1>

          <p className="text-sm text-gray-500">
            Open a booking to confirm it, assign staff and record payment.
          </p>
        </header>

        <BookingsToolbar />

        <BookingsTable />
      </div>

      <BookingWorkflowModal />
    </main>
  );
}
