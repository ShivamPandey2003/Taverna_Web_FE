import { useEffect } from "react";
import { useNavigate } from "react-router";

import { SelectedVehicleCard } from "@/components/features/booking/SelectedVehicleCard";
import { SelectVehicleModal } from "@/components/features/booking/SelectVehicleModal";
import { ServicesList } from "@/components/features/booking/ServicesList";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";
import {
  selectBookingVehicle,
  setSelectedVehicle,
} from "@/redux/booking/bookingSlice";
import {
  closeSelectVehicle,
  openSelectVehicle,
  selectBookServiceModal,
} from "@/redux/modals/bookServiceModal/bookServiceModalSlice";
import { openRegisterVehicle } from "@/redux/modals/dashboardModal/dashboardModalSlice";

export function BookService() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const vehicles = useAppSelector(selectVehicles);
  const selectedVehicle = useAppSelector(selectBookingVehicle);
  const { selectVehicleOpen } = useAppSelector(selectBookServiceModal);

  // With one vehicle pick it automatically; with several ask the user
  useEffect(() => {
    if (selectedVehicle || vehicles.length === 0) return;

    if (vehicles.length === 1) {
      dispatch(setSelectedVehicle(vehicles[0].id));
    } else {
      dispatch(openSelectVehicle());
    }
  }, [dispatch, selectedVehicle, vehicles]);

  const handleAddVehicle = () => {
    dispatch(openRegisterVehicle());
    navigate("/dashboard");
  };

  return (
    <main className="min-h-0 h-full bg-[#f8f9fa] px-6 py-4 lg:px-10 overflow-auto">
      <div className="mx-auto">

        {/* Page Header */}
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Book Service
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Choose a service that fits your needs. We'll take
            care of the rest.
          </p>
        </header>

        {/* Vehicle */}
        <section className="mt-8 sticky top-0 bg-[#f8f9fa] pb-4">
          <h2 className="mb-4 text-base font-bold text-gray-900">
            My Vehicle
          </h2>

          {vehicles.length === 0 ? (
            <div className="flex items-center justify-between gap-6 rounded-2xl border border-dashed border-gray-300 bg-white p-6">
              <p className="text-sm text-gray-500">
                Add a vehicle to book a service.
              </p>

              <button
                type="button"
                onClick={handleAddVehicle}
                className="shrink-0 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Add Vehicle
              </button>
            </div>
          ) : (
            <SelectedVehicleCard
              onChange={() => dispatch(openSelectVehicle())}
            />
          )}
        </section>

        {/* Services */}
        <section className="mt-8">
          <h2 className="mb-4 text-base font-bold text-gray-900">
            Services For You
          </h2>

          <ServicesList />
        </section>

      </div>
      <SelectVehicleModal
        open={selectVehicleOpen}
        onClose={() => dispatch(closeSelectVehicle())}
      />
    </main>
  );
}
