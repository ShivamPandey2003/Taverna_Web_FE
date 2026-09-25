import { BookingsTable } from "@/components/features/admin/BookingsTable";
import { BookingsToolbar } from "@/components/features/admin/BookingsToolbar";
import { BookingDetailsModal } from "@/components/features/admin/details/BookingDetailsModal";
import { BookingWorkflowModal } from "@/components/features/admin/workflow/BookingWorkflowModal";
import { StaffFormModal } from "@/components/features/staff/StaffFormModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { closeAddStaff, selectAdminModal } from "@/redux/modals/adminModal/adminModalSlice";

export function AdminBookings() {
  const dispatch = useAppDispatch();
  const { addStaff } = useAppSelector(selectAdminModal);

  return (
    <main className="min-h-0 h-full overflow-auto bg-[#f8f9fa] px-6 py-4 lg:px-10">
      <div className="mx-auto space-y-3">
        {/* Page header */}
        <header className="flex flex-wrap items-baseline gap-x-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Bookings
          </h1>

          <p className="text-sm text-gray-500">
            Open a booking to see its details, or manage it to confirm, assign staff and record payment.
          </p>
        </header>

        <BookingsToolbar />

        <BookingsTable />
      </div>

      <BookingDetailsModal />
      <BookingWorkflowModal />
      {/* Opened from the workflow's assign steps, on top of the workflow modal */}
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
