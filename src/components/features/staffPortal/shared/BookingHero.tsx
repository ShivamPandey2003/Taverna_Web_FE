import type { ReactNode } from "react";
import { Car, Danger } from "reicon-react";
import type { StaffBooking } from "@/types/admin";
import { brandName } from "@/libs/utils";

interface BookingHeroProps {
  title: string;
  booking: StaffBooking;
  status: ReactNode;
}

// Top card: which job this is, how it's going and the vehicle it's about
// (who it's assigned to is in the brand bar, see StaffLayout)
export function BookingHero({ title, booking, status }: BookingHeroProps) {
  const { vehicle, driveable } = booking;
  // Staff match the VIN's end against the windshield plate
  const vinStart = vehicle.vin.slice(0, -6);
  const vinEnd = vehicle.vin.slice(-6);

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">{title}</h1>
          <p className="muted mt-0.5">Booking {booking.id}</p>
        </div>
        {status}
      </div>

      <div className="info-list mt-4 border-t border-border pt-4">
        <div className="info-row">
          <span className="info-icon">
            <Car size={18} />
          </span>
          <div className="min-w-0">
            <p className="info-value">
              {vehicle.year} {brandName(vehicle.brand)} {vehicle.model}
            </p>
            <p className="mt-0.5 break-all font-mono text-sm tracking-wide text-text-secondary">
              VIN {vinStart}
              <strong className="font-bold text-text">{vinEnd}</strong>
            </p>
          </div>
        </div>
      </div>

      {!driveable && (
        <div className="notice notice-warning mt-4">
          <Danger size={18} className="mt-px shrink-0" />
          <span>
            <strong className="font-semibold">Not driveable.</strong> A tow truck moves this
            vehicle. Don't try to drive it.
          </span>
        </div>
      )}
    </section>
  );
}
