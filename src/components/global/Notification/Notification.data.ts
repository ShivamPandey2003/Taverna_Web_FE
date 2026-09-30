import type { Notification } from "@/types/notification";

export const defaultNotifications: Notification[] = [
  {
    id: "1",
    type: "valet",
    title: "Valet Arriving Soon",
    description:
      "Michael R. is 12 min away from your address",
    time: "9:12 AM",
    section: "TODAY",
    read: false,
  },
  {
    id: "2",
    type: "pickup",
    title: "Vehicle Picked Up",
    description:
      "Your 2022 Jeep Grand Cherokee has been picked up",
    time: "8:58 AM",
    section: "TODAY",
    read: false,
  },
  {
    id: "3",
    type: "booking",
    title: "Booking Confirmed",
    description:
      "Booking #PC-482913 confirmed for Pickup & Delivery",
    time: "8:55 AM",
    section: "TODAY",
    read: true,
  },
  {
    id: "4",
    type: "offer",
    title: "Special Offer",
    description:
      "Trade-In Bonus — Up to $3,000 over book value. Expires Aug 31",
    time: "3:42 PM",
    section: "YESTERDAY",
    read: true,
  },
  {
    id: "5",
    type: "payment",
    title: "Payment Processed",
    description:
      "$89.99 charged for Premium Oil Change service",
    time: "11:18 AM",
    section: "YESTERDAY",
    read: true,
  },
  {
    id: "6",
    type: "plan",
    title: "Plan Update",
    description:
      "ProCarma Plan renewed — 6 services available this cycle",
    time: "Mon, Aug 14",
    section: "EARLIER THIS WEEK",
    read: true,
  },
  {
    id: "7",
    type: "document",
    title: "Document Reminder",
    description:
      "Your insurance card expires in 30 days. Please update.",
    time: "Mon, Aug 14",
    section: "EARLIER THIS WEEK",
    read: true,
  },
];