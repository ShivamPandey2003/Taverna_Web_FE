import { X } from "reicon-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import type { Vehicle } from "@/types/vehicle";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { removeVehicle, selectVehicleById } from "@/redux/vehicle/vehicleSlice";
import { setSelectedVehicle } from "@/redux/booking/bookingSlice";
import {
  closeVehicleDetails,
  selectDashboardModal,
} from "@/redux/modals/dashboardModal/dashboardModalSlice";

interface ServiceHistory {
  id: string;
  date: string;
  dealership: string;
  mileage: string;
  amount: string;
  status: "COMPLETED" | "CANCELLED";
}

interface SavedVehicleDetailsModalProps {
  serviceHistory?: ServiceHistory[];
  onViewHistory?: () => void;
}

// Details of a vehicle already in the user's list
export function SavedVehicleDetailsModal({
  serviceHistory = [],
  onViewHistory,
}: SavedVehicleDetailsModalProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { viewVehicleId } = useAppSelector(selectDashboardModal);
  const vehicle = useAppSelector((state) =>
    selectVehicleById(state, viewVehicleId)
  );

  if (!vehicle) {
    return null;
  }

  const onClose = () => dispatch(closeVehicleDetails());

  const onBookService = () => {
    dispatch(setSelectedVehicle(vehicle.id));
    dispatch(closeVehicleDetails());
    navigate("/dashboard/book-service");
  };

  const onRemoveVehicle = () => {
    dispatch(removeVehicle(vehicle.id));
    toast.success(`${vehicle.brand} ${vehicle.model} removed`);
  };

  return (
    <div className="absolute inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal wrapper */}
      <div className="relative flex min-h-full items-center justify-center overflow-y-auto p-6">
        {/* Modal */}
        <div
          className="relative w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#111827]">
              Vehicle Details
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          {/* Vehicle image */}
          <VehicleHero vehicle={vehicle} />

          {/* Vehicle information */}
          <VehicleInformation vehicle={vehicle} />

          {/* Service history */}
          <ServiceHistorySection
            history={serviceHistory}
            onViewHistory={onViewHistory}
          />

          {/* Divider */}
          <div className="my-5 h-px bg-gray-200" />

          {/* Book service */}
          <button
            type="button"
            onClick={onBookService}
            className="h-12 w-full rounded-xl bg-[#111827] text-sm font-semibold text-white transition hover:bg-black"
          >
            Book a New Service
          </button>

          {/* Remove vehicle */}
          {/* <button
            type="button"
            onClick={onRemoveVehicle}
            className="mt-4 block w-full text-center text-sm font-semibold text-gray-700 transition hover:text-red-600"
          >
            Remove vehicle
          </button> */}
        </div>
      </div>
    </div>
  );
}

interface VehicleHeroProps {
  vehicle: Vehicle;
}

function VehicleHero({ vehicle }: VehicleHeroProps) {
  return (
    <div className="relative mt-5 h-[190px] overflow-hidden rounded-xl bg-white">
      <img
        src={vehicle.image}
        alt={`${vehicle.year} ${vehicle.brand} ${vehicle.model}`}
        className="h-full w-full object-contain"
      />

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-[85px] bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Vehicle name */}
      <h3 className="absolute bottom-4 left-4 text-lg font-bold text-white">
        {vehicle.year} {vehicle.brand} {vehicle.model}
      </h3>
    </div>
  );
}

interface VehicleInformationProps {
  vehicle: Vehicle;
}

function VehicleInformation({
  vehicle,
}: VehicleInformationProps) {
  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      {/* VIN */}
      <div>
        <p className="text-xs text-gray-500">
          VIN
        </p>

        <p className="mt-1 text-sm font-bold tracking-wide text-gray-900">
          {vehicle.vin}
        </p>
      </div>

      <div className="my-3 h-px bg-gray-200" />

      {/* Vehicle stats */}
      <div className="grid grid-cols-3">
        <VehicleStat
          label="YEAR"
          value={vehicle.year}
        />

        <VehicleStat
          label="MILES"
          value={vehicle.miles}
        />

        {/* <VehicleStat
          label="MODEL"
          value={vehicle.color}
        /> */}
      </div>
    </div>
  );
}

function VehicleStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border-r border-gray-200 px-3 first:pl-0 last:border-r-0">
      <p className="text-[11px] font-medium text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

interface ServiceHistorySectionProps {
  history: ServiceHistory[];
  onViewHistory?: () => void;
}

function ServiceHistorySection({
  history,
  onViewHistory,
}: ServiceHistorySectionProps) {
  return (
    <section className="mt-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900">
          Service History
        </h3>

        <button
          type="button"
          onClick={onViewHistory}
          className="text-xs font-medium text-gray-500 transition hover:text-gray-900"
        >
          View all &gt;
        </button>
      </div>

      {/* History */}
      <div className="mt-4 space-y-3">
        {history.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              No service history available.
            </p>
          </div>
        ) : (
          history.slice(0, 1).map((service) => (
            <ServiceHistoryCard
              key={service.id}
              service={service}
            />
          ))
        )}
      </div>
    </section>
  );
}

interface ServiceHistoryCardProps {
  service: ServiceHistory;
}

function ServiceHistoryCard({
  service,
}: ServiceHistoryCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-900">
            {service.date}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {service.dealership}
          </p>
        </div>

        <span
          className={[
            "rounded-full px-3 py-1",
            "text-[10px] font-bold",
            service.status === "COMPLETED"
              ? "bg-emerald-500 text-white"
              : "bg-red-100 text-red-600",
          ].join(" ")}
        >
          {service.status}
        </span>
      </div>

      {/* Divider */}
      <div className="my-3 h-px bg-gray-200" />

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {service.mileage}
        </p>

        <p className="text-sm font-bold text-gray-900">
          {service.amount}
        </p>
      </div>
    </article>
  );
}