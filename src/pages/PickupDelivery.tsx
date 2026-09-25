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
import { TowTruckNotice } from "@/components/features/review/TowTruckNotice";
import { SelectVehicleModal } from "@/components/features/booking/SelectVehicleModal";
import { AddAddressModal } from "@/components/features/addresses/AddAddressModal";
import { ServiceInProgressNotice } from "@/components/features/booking/ServiceInProgressNotice";
import { useServiceInProgress } from "@/components/features/tracking/serviceStatus";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectBooking,
  selectBookingAddress,
  selectBookingDealership,
  selectBookingService,
  selectBookingVehicle,
  setDriveable,
  setPickupLocation,
} from "@/redux/booking/bookingSlice";
import { confirmBooking } from "@/redux/booking/bookingThunks";
import {
  closeReviewModal,
  openReviewModal,
  selectReviewModal,
} from "@/redux/modals/reviewModal/reviewModalSlice";
import type { ServiceId } from "@/types/service";
import { cn } from "@/libs/utils";

const serviceSubtitle: Record<ServiceId, string> = {
  "pickup-delivery": "We pickup & deliver",
  "loaner-only": "Drive in and swap vehicles",
};

export function PickupDelivery() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const service = useAppSelector(selectBookingService);
  const { driveable, pickupLocation } = useAppSelector(selectBooking);
  const vehicle = useAppSelector(selectBookingVehicle);
  const address = useAppSelector(selectBookingAddress);
  const dealership = useAppSelector(selectBookingDealership);
  const activeModal = useAppSelector(selectReviewModal);

  const hasPickup = !!address || pickupLocation?.type === "current";
  const [booking, setBooking] = useState(false);
  // One service at a time. Ignored while this page's own booking is being placed,
  // so the notice doesn't flash before we move to tracking.
  const serviceInProgress = useServiceInProgress() && !booking;
  const canBook = !!vehicle && hasPickup && !!dealership && !serviceInProgress;
  // Loaner Only customers drive in themselves, so there's no pickup to schedule
  const canSchedule = service.id !== "loaner-only";

  const closeModal = () => dispatch(closeReviewModal());

  const handleBook = async (scheduledAt: string | null = null) => {
    if (serviceInProgress) {
      toast.error("You can book again once your current service is complete.");
      return;
    }
    if (!canBook) {
      toast.error("Select a vehicle, pickup address and dealership first.");
      return;
    }

    setBooking(true);
    const booked = await dispatch(confirmBooking(scheduledAt));

    // A failed API call has already been reported by the API layer
    if (booked) {
      navigate("/dashboard/book-service/tracking", { replace: true });
    } else {
      setBooking(false);
    }
  };

  return (
    <main className="min-h-0 h-full overflow-auto bg-[#f8f9fa] px-6 pt-4 lg:px-10">
      <div className="mx-auto">
        {/* Page header */}
        <header className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 transition hover:bg-gray-50"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {service.title}
            </h1>

            <p className="mt-0.5 text-sm text-gray-500">{serviceSubtitle[service.id]}</p>
          </div>
        </header>

        {serviceInProgress && (
          <div className="mt-6">
            <ServiceInProgressNotice />
          </div>
        )}

        {/* Vehicle */}
        <div className="mt-9">
          <VehicleSummary />
        </div>

        {/* Address */}
        <div className="mt-5">
          <AddressSummary />
        </div>

        {/* Dealership */}
        <div className="mt-5">
          <DealershipSummary />
        </div>

        {/* Loaner Only customers drive in themselves, so driveable/tow doesn't apply */}
        {service.id !== "loaner-only" && (
          <>
            <div className="mt-5">
              <DriveableStatus />
            </div>

            {!driveable && <div className="mt-5">
              <TowTruckNotice price={49} onClose={() => dispatch(setDriveable(true))} />
            </div>}
          </>
        )}

        {/* Concern */}
        <div className="mt-5">
          <ConcernInput />
        </div>

        {/* Actions */}
        <div
          className={cn(
            "mt-10 grid grid-cols-1 gap-5 sticky bottom-0 bg-[#f8f9fa] w-full p-2",
            canSchedule && "sm:grid-cols-2",
          )}
        >
          {canSchedule && (
            <button
              type="button"
              disabled={!canBook || booking}
              onClick={() => dispatch(openReviewModal("schedule"))}
              className="h-[52px] rounded-lg border border-gray-900 bg-white text-sm font-semibold text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Schedule
            </button>
          )}

          <button
            type="button"
            disabled={!canBook || booking}
            onClick={() => handleBook()}
            className="h-[52px] rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {booking ? "Booking..." : "Book Now"}
          </button>
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
          dispatch(setPickupLocation({ type: "saved", addressId: saved.id }));
          closeModal();
        }}
      />
      <SchedulePickupModal
        open={canSchedule && activeModal === "schedule"}
        onClose={closeModal}
        onConfirm={(date) => {
          closeModal();
          handleBook(date.toISOString());
        }}
      />
      <SelectDealershipModal
        open={activeModal === "dealership"}
        onClose={closeModal}
      />
    </main>
  );
}
