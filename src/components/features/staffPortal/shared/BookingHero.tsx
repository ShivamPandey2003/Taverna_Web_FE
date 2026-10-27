import type { ReactNode } from "react";
import { Calendar, Call, Danger } from "reicon-react";
import { telLink } from "@/libs/utils";
import { brandImage } from "@/libs/vehicleImage";

// What the card shows of a booking
export interface HeroBooking {
  id: string;
  vehicle: { name: string; vin: string; image?: string };
  // Only shown with `columns`
  customer?: { name: string; phone: string };
  // false adds the "Not driveable" warning; `towTruck` picks its wording
  driveable?: boolean;
  towTruck?: boolean;
}

interface BookingHeroProps {
  title: string;
  booking: HeroBooking;
  status: ReactNode;
  // The trip's date and time, e.g. "Scheduled pickup" / "Tue, Oct 6 • 7:32 PM".
  // Leave out on pages where it doesn't apply.
  when?: { label: string; value: string };
  // Vehicle, date and customer side by side in three columns instead of stacked
  // rows. Needs the wider page (see `staff-wide` in index.css).
  columns?: boolean;
}

// Top card: which job this is, how it's going and the vehicle it's about
// (who it's assigned to is in the brand bar, see StaffLayout)
export function BookingHero({
  title,
  booking,
  status,
  when,
  columns,
}: BookingHeroProps) {
  const { vehicle, driveable = true, customer } = booking;
  // Staff match the VIN's end against the windshield plate
  const vinStart = vehicle.vin.slice(0, -6);
  const vinEnd = vehicle.vin.slice(-6);

  return (
    <section className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight">
            {title}
          </h1>
          <p className="muted mt-0.5">Booking {booking.id}</p>
        </div>
        {status}
      </div>

      {columns ? (
        <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
          <div className="flex min-w-0 items-center gap-3 sm:pr-4">
            <img
              src={vehicle.image || brandImage(vehicle.name)}
              alt=""
              className="h-9 w-14 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="info-value">
                {vehicle.name}
              </p>
              <p className="mt-0.5 text-sm text-text-secondary">
                VIN **
                <strong className="font-bold text-text">
                  {vehicle.vin.slice(-5)}
                </strong>
              </p>
            </div>
          </div>

          {when && (
            <div className="min-w-0 sm:px-4">
              <p className="info-label">{when.label}</p>
              <p className="info-value mt-0.5">{when.value}</p>
            </div>
          )}

          {customer && (
          <div className="flex min-w-0 items-center gap-3 sm:pl-4">
            <div className="min-w-0 flex-1">
              <p className="info-label">Customer</p>
              <p className="info-value mt-0.5 truncate">{customer.name}</p>
              <p className="muted">{customer.phone}</p>
            </div>
            <a
              data-test-id="booking-hero-call-customer"
              href={telLink(customer.phone)}
              className="icon-btn icon-btn-primary"
              aria-label={`Call ${customer.name}`}
            >
              <Call size={20} />
            </a>
          </div>
          )}
        </div>
      ) : (
        <div className="info-list mt-4 border-t border-border pt-4">
          <div className="info-row">
            {/* Bookings don't carry the vehicle's photo yet, so this is the stock one for now */}
            <img
              src={vehicle.image || brandImage(vehicle.name)}
              alt=""
              className="mt-0.5 h-9 w-14 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="info-value">
                {vehicle.name}
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
      )}

      {!driveable && (
        <div className="notice notice-warning mt-4">
          <Danger size={18} className="mt-px shrink-0" />
          <span>
            <strong className="font-semibold">Not driveable.</strong>{" "}
            {booking.towTruck === false
              ? "The customer declined the tow truck. Don't try to drive it."
              : "A tow truck moves this vehicle. Don't try to drive it."}
          </span>
        </div>
      )}
    </section>
  );
}
