import { MessageText2, Phone } from "reicon-react";
import { shortName } from "@/libs/utils";
import type { StaffMember } from "@/types/admin";

interface StaffContactCardProps {
  member: StaffMember;
  // e.g. "Valet", "Relation Manager"
  role: string;
}

// Person handling the customer's booking, with call and text shortcuts
export function StaffContactCard({ member, role }: StaffContactCardProps) {
  const phone = member.phone.replace(/[^\d+]/g, "");

  return (
    <section className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-base font-semibold text-emerald-800">
            {member.name.charAt(0).toUpperCase()}
          </div>
          {/* Assigned and reachable */}
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-status-active" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-gray-900">{shortName(member.name)}</p>
          <p className="mt-0.5 text-[13px] text-gray-500">{role}</p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <a
          href={`tel:${phone}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-900 transition hover:bg-gray-200"
          aria-label={`Call ${member.name}`}
        >
          <Phone size={18} />
        </a>
        <a
          href={`sms:${phone}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-900 transition hover:bg-gray-200"
          aria-label={`Message ${member.name}`}
        >
          <MessageText2 size={18} />
        </a>
      </div>
    </section>
  );
}
