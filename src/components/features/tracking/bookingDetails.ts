import { toast } from "sonner";
import { services } from "@/components/features/booking/booking.data";
import { brandName, formatPickupTime, maskedVin } from "@/libs/utils";
import type { AccountUser } from "@/redux/account/accountSlice";
import type { Booking, CustomerBookingDetails } from "@/types/booking";

// The booking details show only the VIN's end: "***50575"
const VIN_VISIBLE = 5;

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

// The booking, the vehicle as it was booked and who booked it, from the API's
// details once loaded (the Redux snapshot until then). The booking group always
// comes first; it has no title of its own.
export function getBookingDetailGroups(
  booking: Booking,
  user: AccountUser,
  details?: CustomerBookingDetails | null,
): DetailGroup[] {
  if (details) return detailGroupsFromApi(details);
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
        ...(booking.driveable
          ? []
          : [{ label: "Tow truck", value: booking.towTruck === false ? "Not included" : "Included" }]),
        { label: "Pickup address", value: pickupLabel(booking.pickup), wide: true },
        { label: "Dealership", value: booking.dealership.name, wide: true },
      ],
    },
    {
      title: "Vehicle",
      details: [
        { label: "Make", value: brandName(vehicle.brand) },
        { label: "Model", value: `${vehicle.year} ${vehicle.model}` },
        { label: "VIN", value: maskedVin(vehicle.vin, VIN_VISIBLE) },
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

function detailGroupsFromApi(details: CustomerBookingDetails): DetailGroup[] {
  return [
    {
      title: "",
      details: [
        { label: "Booking ID", value: `#${details.id}` },
        { label: "Service", value: details.service || "—" },
        { label: "Scheduled pickup", value: details.scheduled || details.bookingDate || "—" },
        { label: "Vehicle driveable", value: details.isDriveable ? "Yes" : "No" },
        ...(details.isDriveable
          ? []
          : [{ label: "Tow truck", value: details.towRequested ? "Included" : "Not included" }]),
        { label: "Pickup address", value: details.pickupAddress || "—", wide: true },
        { label: "Dealership", value: details.dealershipName || "—", wide: true },
      ],
    },
    {
      title: "Vehicle",
      details: [
        { label: "Make", value: brandName(details.vehicleMake) },
        { label: "Model", value: `${details.vehicleYear} ${details.vehicleModel}` },
        { label: "VIN", value: maskedVin(details.vin, VIN_VISIBLE) },
      ],
    },
    {
      title: "User Details",
      details: [
        { label: "Name", value: details.customerName ?? "" },
        { label: "Phone", value: details.customerPhone ?? "" },
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
export async function shareBooking(
  booking: Booking,
  user: AccountUser,
  details?: CustomerBookingDetails | null,
) {
  const title = `Taverna booking #${booking.id}`;
  const text = shareText(getBookingDetailGroups(booking, user, details), booking.concern.trim());

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
