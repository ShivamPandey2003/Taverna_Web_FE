import { toast } from "sonner";
import { services } from "@/components/features/booking/booking.data";
import { brandName, formatPickupTime } from "@/libs/utils";
import type { AccountUser } from "@/redux/account/accountSlice";
import type { Booking } from "@/types/booking";

export interface Detail {
  label: string;
  value: string;
  // Long values (addresses) get two columns
  wide?: boolean;
}

export interface DetailGroup {
  title: string;
  details: Detail[];
}

// "12 Main St, Plantation, FL 33324", or the label of a current-location pickup
function pickupLabel(pickup: Booking["pickup"]) {
  return "label" in pickup
    ? pickup.label
    : `${pickup.address}, ${pickup.city}, ${pickup.state} ${pickup.zip}`;
}

// The booking, the vehicle as it was booked and who booked it. The booking group
// always comes first; it has no title of its own.
export function getBookingDetailGroups(booking: Booking, user: AccountUser): DetailGroup[] {
  const { vehicle } = booking;

  return [
    {
      title: "",
      details: [
        { label: "Booking ID", value: `#${booking.id}` },
        {
          label: "Service",
          value: services.find((service) => service.id === booking.serviceId)?.title ?? "—",
        },
        {
          label: booking.scheduledAt ? "Scheduled pickup" : "Booked on",
          value: formatPickupTime(booking.scheduledAt ?? booking.createdAt),
        },
        { label: "Vehicle driveable", value: booking.driveable ? "Yes" : "No" },
        { label: "Pickup address", value: pickupLabel(booking.pickup), wide: true },
        { label: "Dealership", value: booking.dealership.name, wide: true },
      ],
    },
    {
      title: "Vehicle",
      details: [
        { label: "Make", value: brandName(vehicle.brand) },
        { label: "Model", value: `${vehicle.year} ${vehicle.model}` },
        { label: "VIN", value: vehicle.vin },
        // { label: "Miles at booking", value: vehicle.miles || "—" },
      ],
    },
    {
      title: "User Details",
      // Only what the account actually has
      details: [
        { label: "Name", value: user.name },
        { label: "Phone", value: user.phone },
      ].filter((detail) => detail.value.trim()),
    },
  ].filter((group) => group.details.length > 0);
}

// The details as plain text, for the share sheet or the clipboard
function shareText(groups: DetailGroup[], concern: string) {
  const lines = groups.flatMap((group) => [
    "",
    group.title,
    ...group.details.map((detail) => `${detail.label}: ${detail.value}`),
  ]);
  if (concern) lines.push("", `Concern: ${concern}`);
  return lines.join("\n").trim();
}

// Shares the booking's details through the device's share sheet where there is
// one (phones), otherwise copies them to the clipboard
export async function shareBooking(booking: Booking, user: AccountUser) {
  const title = `Taverna booking #${booking.id}`;
  const text = shareText(getBookingDetailGroups(booking, user), booking.concern.trim());

  try {
    if (navigator.share) {
      await navigator.share({ title, text });
    } else {
      await navigator.clipboard.writeText(`${title}\n\n${text}`);
      toast.success("Booking details copied");
    }
  } catch (error) {
    // Closing the share sheet isn't a failure
    if (error instanceof DOMException && error.name === "AbortError") return;
    toast.error("Couldn't share the booking details");
  }
}
