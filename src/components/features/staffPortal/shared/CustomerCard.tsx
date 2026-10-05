import { Call } from "reicon-react";
import type { StaffBooking } from "@/types/admin";
import { initials, telLink } from "@/libs/utils";

// Who to call if something comes up; a big round button for one-tap calling
export function CustomerCard({ customer }: { customer: StaffBooking["customer"] }) {
  return (
    <section className="card">
      <p className="eyebrow">Customer</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="avatar">{initials(customer.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="info-value truncate">{customer.name}</p>
          <p className="muted">{customer.phone}</p>
        </div>
        <a href={telLink(customer.phone)} className="icon-btn icon-btn-primary" aria-label={`Call ${customer.name}`}>
          <Call size={20} />
        </a>
      </div>
    </section>
  );
}
