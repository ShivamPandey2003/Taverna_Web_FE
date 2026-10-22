import { useQueryClient } from "@tanstack/react-query";
import { bookingKeys } from "@/services/queries/bookingQueries";
import { useState } from "react";
import { ArrowLeft } from "reicon-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { VehicleSummary } from "@/components/features/review/VehicleSummary";
import { AddressSummary } from "@/components/features/review/AddressSummary";
import { DealershipSummary } from "@/components/features/review/DealershipSummary";
import { ConcernInput } from "@/components/features/review/ConcernInput";
import { SelectLocationModal } from "@/components/features/review/SelectLocationModal";
import { SchedulePickupModal } from "@/components/features/review/SchedulePickupModal";
import { SelectDealershipModal } from "@/components/features/review/SelectDealershipModal";
import { DriveableStatus } from "@/components/features/review/DriveableStatus";
import { ScheduleSummary } from "@/components/features/review/ScheduleSummary";
import { ServiceTabs } from "@/components/features/review/ServiceTabs";
import { UserSummary } from "@/components/features/review/UserSummary";
import { hasUserDetails } from "@/components/features/review/review.utils";
import { selectAccountUser } from "@/redux/account/accountSlice";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatPickupTime, vehicleName } from "@/libs/utils";
import { SelectVehicleModal } from "@/components/features/booking/SelectVehicleModal";
import { AddAddressModal } from "@/components/features/addresses/AddAddressModal";
import { ServiceInProgressNotice } from "@/components/features/booking/ServiceInProgressNotice";
import { trackingPath, useVehicleService } from "@/components/features/tracking/serviceStatus";
import { useClosestDealership } from "@/hooks/useClosestDealership";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectBooking,
  selectBookingAddress,
  selectBookingDealership,
  selectBookingService,
  selectBookingVehicle,
  changePickupLocation,
  setScheduledAt,
} from "@/redux/booking/bookingSlice";
import { confirmBooking } from "@/redux/booking/bookingThunks";
import {
  closeReviewModal,
  openReviewModal,
  selectReviewModal,
} from "@/redux/modals/reviewModal/reviewModalSlice";
// import type { ServiceId } from "@/types/service";

// const serviceSubtitle: Record<ServiceId, string> = {
//   "pickup-delivery": "We pickup & deliver",
//   "loaner-only": "Drive in and swap vehicles",
// };

// Checked when the customer books, not while the page renders
function hasPassed(time: string) {
  return new Date(time).getTime() <= Date.now();
}

export function PickupDelivery() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const service = useAppSelector(selectBookingService);
  const { pickupLocation, scheduledAt } = useAppSelector(selectBooking);
  const vehicle = useAppSelector(selectBookingVehicle);
  const address = useAppSelector(selectBookingAddress);
  const dealership = useAppSelector(selectBookingDealership);
  const user = useAppSelector(selectAccountUser);
  const activeModal = useAppSelector(selectReviewModal);
  // Selects the dealership closest to the customer when none is chosen yet
  const { loading: findingDealership } = useClosestDealership();

  const hasPickup = !!address || pickupLocation?.type === "current";
  const [booking, setBooking] = useState(false);
  // One service per vehicle at a time. Ignored while this page's own booking is being
  // placed, so the notice doesn't flash before we move to tracking.
  const vehicleService = useVehicleService(vehicle?.vin);
  const serviceInProgress = !!vehicleService && !booking;
  const canBook = !!vehicle && hasPickup && !!dealership && !serviceInProgress;
  // Loaner Only customers drive in themselves: a time for later is when they
  // drop the vehicle off at the dealership, not a valet's pickup
  const loanerOnly = service.id === "loaner-only";
  // The first card (vehicle, my details, address, dealership) still missing
  // something; highlighted so the customer knows what to fill first. Driveable
  // always has an answer and the concern is optional, so neither is ever next.
  // The dealership isn't next while the closest one is still being found.
  const nextStep = !vehicle
    ? "vehicle"
    : !hasUserDetails(user)
      ? "user"
      : !hasPickup
        ? "address"
        : !dealership && !findingDealership
          ? "dealership"
          : null;
  const scheduled = !!scheduledAt;

  const closeModal = () => dispatch(closeReviewModal());

  const handleBook = async () => {
    if (serviceInProgress) {
      toast.error("You can book this vehicle again once its current service is complete.");
      return;
    }
    if (!canBook) {
      toast.error("Select a vehicle, pickup address and dealership first.");
      return;
    }
    // The current location has no saved address for the API to book against
    if (!address) {
      toast.error("Booking needs a saved address. Pick one of yours or add a new one.");
      dispatch(openReviewModal("location"));
      return;
    }

    if (scheduled && hasPassed(scheduledAt!)) {
      toast.error(`Your scheduled ${loanerOnly ? "drop-off" : "pickup"} time has passed. Pick a new time.`);
      dispatch(openReviewModal("schedule"));
      return;
    }

    // A booking for later is placed only once the customer confirms it in the modal
    if (scheduled) {
      dispatch(openReviewModal("confirmBooking"));
      return;
    }

    await placeBooking();
  };

  const placeBooking = async () => {
    setBooking(true);
    const bookingId = await dispatch(confirmBooking());

    // A failed API call has already been reported by the API layer
    if (bookingId) {
      // So the list of open bookings has the new one before its next poll
      queryClient.invalidateQueries({ queryKey: bookingKeys.list });
      closeModal();
      navigate(trackingPath(bookingId), { replace: true });
    } else {
      setBooking(false);
    }
  };

  return (
    <main className="min-h-0 h-full overflow-auto bg-[#f8f9fa] px-4 py-5 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        {/* Page header: title on the left, booking actions on the right */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 transition hover:bg-gray-50"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="min-w-0 flex-1 sm:flex-none">
              {/* The page title, and the switch between the services */}
              <h1 className="sr-only">{service.title}</h1>
              <ServiceTabs disabled={booking} />

              {/* <p className="mt-0.5 text-sm text-gray-500">{serviceSubtitle[service.id]}</p> */}
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full gap-3 sm:w-auto">
            <button
              type="button"
              disabled={!canBook || booking}
              onClick={() => dispatch(openReviewModal("schedule"))}
              className="h-11 flex-1 whitespace-nowrap rounded-lg border border-gray-900 bg-white px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-8"
            >
              {/* "Schedule" alone on phones, where the full label wraps */}
              {scheduled ? (
                "Reschedule"
              ) : (
                <>
                  <span className="sm:hidden">Schedule</span>
                  <span className="hidden sm:inline">Schedule for Later</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={!canBook || booking}
              onClick={() => handleBook()}
              className="h-11 flex-1 whitespace-nowrap rounded-lg bg-black px-4 sm:px-8 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              {booking ? "Booking..." : scheduled ? "Confirm Booking" : "Book Now"}
            </button>
          </div>
        </header>

        {serviceInProgress && vehicleService && (
          <div className="mt-5">
            <ServiceInProgressNotice service={vehicleService} />
          </div>
        )}

        {/* Two columns, each card its own height: vehicle, address, driveable (with
            towing) and the scheduled pickup on the left; my details, dealership and
            the concern on the right, read across in pairs (vehicle / my details,
            address / dealership, driveable / concern). The first card still missing
            something is highlighted. Loaner Only customers drive in themselves, so
            there's no driveable question, tow or pickup time. */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <VehicleSummary step={1} highlight={nextStep === "vehicle"} />
            <AddressSummary step={3} highlight={nextStep === "address"} />
            {!loanerOnly && <DriveableStatus step={5} />}
            <ScheduleSummary step={loanerOnly ? 6 : 7} />
          </div>

          <div className="flex flex-col gap-5">
            <UserSummary step={2} highlight={nextStep === "user"} />
            <DealershipSummary
              step={4}
              highlight={nextStep === "dealership"}
              loading={findingDealership}
            />
            <ConcernInput step={loanerOnly ? 5 : 6} />
          </div>
        </div>
      </div>

      <SelectVehicleModal
        open={activeModal === "vehicle"}
        onClose={closeModal}
      />
      <SelectLocationModal
        open={activeModal === "location"}
        onClose={closeModal}
        onAddAddress={() => dispatch(openReviewModal("addAddress"))}
      />
      <AddAddressModal
        open={activeModal === "addAddress"}
        onClose={closeModal}
        onSaved={(saved) => {
          dispatch(changePickupLocation({ type: "saved", addressId: saved.id }));
          closeModal();
        }}
      />
      <SchedulePickupModal
        open={activeModal === "schedule"}
        onClose={closeModal}
        onConfirm={(date) => {
          // Saved for Book; the card on this page shows it
          dispatch(setScheduledAt(date.toISOString()));
          closeModal();
        }}
      />
      <SelectDealershipModal
        open={activeModal === "dealership"}
        onClose={closeModal}
      />
      {/* Only for a booking scheduled for later; stays open (locked) while it's placed */}
      {scheduled && activeModal === "confirmBooking" && (
        <ConfirmModal
          title="Confirm Your Booking"
          tone="primary"
          confirmLabel="Confirm Booking"
          cancelLabel="Go Back"
          pendingLabel="Booking..."
          pending={booking}
          onConfirm={() => {
            // The time may have passed while the modal stood open
            if (hasPassed(scheduledAt!)) {
              toast.error(`Your scheduled ${loanerOnly ? "drop-off" : "pickup"} time has passed. Pick a new time.`);
              dispatch(openReviewModal("schedule"));
              return;
            }
            void placeBooking();
          }}
          onClose={() => !booking && closeModal()}
        >
          {loanerOnly ? (
            <p>
              You'll drop off your{" "}
              <span className="font-semibold text-gray-900">
                {vehicle ? vehicleName(vehicle) : "vehicle"}
              </span>
              {dealership && (
                <>
                  {" "}at <span className="font-semibold text-gray-900">{dealership.name}</span>
                </>
              )}{" "}
              on{" "}
              <span className="font-semibold text-gray-900">{formatPickupTime(scheduledAt!)}</span>{" "}
              and pick up your loaner there.
            </p>
          ) : (
          <p>
            Your valet will pick up your{" "}
            <span className="font-semibold text-gray-900">
              {vehicle ? vehicleName(vehicle) : "vehicle"}
            </span>{" "}
            on{" "}
            <span className="font-semibold text-gray-900">{formatPickupTime(scheduledAt!)}</span>
            {address && (
              <>
                {" "}from <span className="font-semibold text-gray-900">{address.address}</span>
              </>
            )}
            {dealership && (
              <>
                {" "}and take it to{" "}
                <span className="font-semibold text-gray-900">{dealership.name}</span>
              </>
            )}
            .
          </p>
          )}
        </ConfirmModal>
      )}
    </main>
  );
}
