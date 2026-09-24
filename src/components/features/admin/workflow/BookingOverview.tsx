import type { AdminBooking } from "@/types/admin";
import { formatDateTime, serviceLabels } from "../admin.utils";

// Read-only summary of what the customer booked
export function BookingOverview({ booking }: { booking: AdminBooking }) {
  const rows: { label: string; value: string }[] = [
    { label: "Customer", value: booking.customer.name },
    { label: "Contact", value: `${booking.customer.email} · ${booking.customer.phone}` },
    {
      label: "Vehicle",
      value: `${booking.vehicle.year} ${booking.vehicle.brand} ${booking.vehicle.model}`,
    },
    { label: "VIN", value: booking.vehicle.vin },
    { label: "Service", value: serviceLabels[booking.serviceId] },
    { label: "Pickup", value: booking.pickup },
    { label: "Dealership", value: booking.dealershipName },
    {
      label: "Scheduled",
      value: booking.scheduledAt ? formatDateTime(booking.scheduledAt) : "As soon as possible",
    },
    { label: "Created", value: formatDateTime(booking.createdAt) },
  ];

  if (booking.serviceId === "pickup-delivery") {
    rows.push({ label: "Driveable", value: booking.driveable ? "Yes" : "No — tow truck needed" });
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-xs text-gray-500">{row.label}</dt>
            <dd className="mt-0.5 break-words text-sm font-semibold text-gray-900">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      {booking.concern && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          <p className="text-xs text-gray-500">Customer concern</p>
          <p className="mt-0.5 text-sm text-gray-900">{booking.concern}</p>
        </div>
      )}
    </section>
  );
}
