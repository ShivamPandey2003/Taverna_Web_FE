import type { NotificationType } from "@/types/notification";
import { Truck, Car, Check, Tag, Card, FileText } from 'reicon-react';

export function NotificationIcon({
  type,
}: {
  type: NotificationType;
}) {
  const config = {
    valet: {
      icon: Truck,
      className: "bg-[#111827] text-white",
    },

    pickup: {
      icon: Car,
      className: "bg-emerald-500 text-white",
    },

    booking: {
      icon: Check,
      className: "bg-[#111827] text-white",
    },

    offer: {
      icon: Tag,
      className: "bg-emerald-500 text-white",
    },

    payment: {
      icon: Card,
      className: "bg-[#111827] text-white",
    },

    plan: {
      icon: Check,
      className: "bg-[#111827] text-white",
    },

    document: {
      icon: FileText,
      className: "bg-gray-400 text-white",
    },
  };

  const { icon: Icon, className } =
    config[type];

  return (
    <div
      className={[
        "flex h-10 w-10 shrink-0 items-center justify-center",
        "rounded-full",
        className,
      ].join(" ")}
    >
      <Icon size={18} strokeWidth={2} />
    </div>
  );
}