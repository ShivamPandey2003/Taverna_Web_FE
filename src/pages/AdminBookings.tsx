import { BookingsTable } from "@/components/features/admin/BookingsTable";
import { BookingsToolbar } from "@/components/features/admin/BookingsToolbar";
import { BookingDetailsModal } from "@/components/features/admin/details/BookingDetailsModal";
import { BookingWorkflowDrawer } from "@/components/features/admin/workflow/BookingWorkflowDrawer";
import { StaffFormModal } from "@/components/features/staff/StaffFormModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { closeAddStaff, selectAdminModal } from "@/redux/modals/adminModal/adminModalSlice";

export function AdminBookings() {
  const dispatch = useAppDispatch();
  const { addStaff } = useAppSelector(selectAdminModal);

  return (
    // The manage drawer sits beside the table: the table shrinks to the left half
    // while it's open and goes back to full width when it closes
    <main className="flex h-full min-h-0 overflow-hidden bg-[#f8f9fa]">
      {/* Doesn't scroll: pages show 10 rows, and only the table scrolls on very short screens */}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3 px-6 py-4 lg:px-10">
        {/* Page header */}
        <header className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Bookings
          </h1>

          <p className="text-sm text-gray-500">
            Open a booking to see its details, or manage it to confirm it, assign valets and an advisor, and complete it.
          </p>
        </header>

        <BookingsToolbar />

        <BookingsTable />
      </div>

      <BookingWorkflowDrawer />
      <BookingDetailsModal />
      {/* Opened from the workflow's assign steps, on top of the drawer */}
      <StaffFormModal
        open={!!addStaff}
        role={addStaff?.role ?? "valet"}
        defaultName={addStaff?.name}
        onClose={() => dispatch(closeAddStaff())}
        stacked
      />
    </main>
  );
}
