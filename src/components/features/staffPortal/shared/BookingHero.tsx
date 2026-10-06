import type { ReactNode } from "react";
import { Calendar, Danger } from "reicon-react";
import defaultVehicleImage from "@/assets/jeep-grand-cherokee.webp";
import type { StaffBooking } from "@/types/admin";
import { brandName } from "@/libs/utils";

interface BookingHeroProps {
  title: string;
  booking: StaffBooking;
  status: ReactNode;
  // The trip's date and time, e.g. "Scheduled pickup" / "Tue, Oct 6 • 7:32 PM".
  // Leave out on pages where it doesn't apply.
  when?: { label: string; value: string };
}

// Top card: which job this is, how it's going and the vehicle it's about
// (who it's assigned to is in the brand bar, see StaffLayout)
export function BookingHero({ title, booking, status, when }: BookingHeroProps) {
  const { vehicle, driveable } = booking;
  // Staff match the VIN's end against the windshield plate
  const vinStart = vehicle.vin.slice(0, -6);
  const vinEnd = vehicle.vin.slice(-6);

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight">{title}</h1>
          <p className="muted mt-0.5">Booking {booking.id}</p>
        </div>
        {status}
      </div>

      <div className="info-list mt-4 border-t border-border pt-4">
        <div className="info-row">
          {/* Bookings don't carry the vehicle's photo yet, so this is the stock one for now */}
          <img
            src={vehicle.image || defaultVehicleImage}
            alt=""
            className="mt-0.5 h-9 w-14 shrink-0 object-contain"
          />
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

        {when && (
          <div className="info-row">
            {/* As wide as the vehicle photo, so both rows' text lines up */}
            <span className="flex w-14 shrink-0 justify-center">
              <span className="info-icon">
                <Calendar size={18} />
              </span>
            </span>
            <div className="min-w-0">
              <p className="info-label">{when.label}</p>
              <p className="info-value">{when.value}</p>
            </div>
          </div>
        )}
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
