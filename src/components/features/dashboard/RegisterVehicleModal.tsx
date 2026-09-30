import { Envelope, Car, Phone, X } from 'reicon-react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { inputClass, SectionHeader } from './SectionHeader';
import { lookupVehicleByVin } from './vehicle.data';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectAccountUser } from '@/redux/account/accountSlice';
import { selectVehicles } from '@/redux/vehicle/vehicleSlice';
import {
  closeRegisterVehicle,
  selectDashboardModal,
  showVerifiedVehicle,
} from '@/redux/modals/dashboardModal/dashboardModalSlice';

const registerVehicleSchema = z.object({
  vin: z
    .string()
    .trim()
    .length(17, "VIN must contain exactly 17 characters")
    .regex(
      /^[A-HJ-NPR-Z0-9]{17}$/i,
      "Enter a valid VIN"
    ),

  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address"),
});

type RegisterVehicleFormData = z.infer<
  typeof registerVehicleSchema
>;

export function RegisterVehicleModal() {
  const { registerVehicleOpen } = useAppSelector(selectDashboardModal);

  // Mounting the form only while open gives it fresh values each time
  if (!registerVehicleOpen) {
    return null;
  }

  return <RegisterVehicleForm />;
}

function RegisterVehicleForm() {
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector(selectVehicles);
  const user = useAppSelector(selectAccountUser);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterVehicleFormData>({
    resolver: zodResolver(registerVehicleSchema),

    defaultValues: {
      vin: "",
      phone: user.phone,
      email: user.email,
    },
  });

  const onClose = () => dispatch(closeRegisterVehicle());

  const handleVerify = async (
    data: RegisterVehicleFormData
  ) => {
    const vin = data.vin.toUpperCase();

    if (vehicles.some((vehicle) => vehicle.vin === vin)) {
      setError("vin", { message: "This vehicle is already in your list" });
      return;
    }

    // API:
    // const vehicle = await verifyVehicle(data);

    dispatch(showVerifiedVehicle(lookupVehicleByVin(vin)));
  };

  return (
    <div className="absolute inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative flex min-h-full items-center justify-center p-6">
        {/* Modal */}
        <div
          className="relative w-full max-w-[520px] rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#111827]">
              Register Vehicle
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900"
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(handleVerify)}
            className="mt-6 space-y-4"
          >
            {/* VIN section */}
            <section className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
              <SectionHeader
                icon={<Car size={17} />}
                title="VIN Number"
              />

              <div className="mt-5">
                <label
                  htmlFor="vin"
                  className="mb-2 block text-xs font-semibold text-gray-900"
                >
                  VIN Number
                </label>

                <div className="relative">
                  <Car
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="vin"
                    {...register("vin")}
                    maxLength={17}
                    placeholder="Enter 17-character VIN"
                    className={inputClass(
                      !!errors.vin
                    )}
                  />
                </div>

                {errors.vin ? (
                  <p className="mt-1.5 text-xs text-red-500">
                    {errors.vin.message}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">
                    17 characters required (e.g.,
                    WPOAA2Y16PSA9XXXX)
                  </p>
                )}
              </div>
            </section>

            {/* Contact section */}
            <section className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
              <SectionHeader
                icon={<Phone size={17} />}
                title="Contact Details"
              />

              <div className="mt-5 space-y-4">
                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-xs font-semibold text-gray-900"
                  >
                    Phone Number
                  </label>

                  <div className="relative">
                    <Phone
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      id="phone"
                      {...register("phone")}
                      type="tel"
                      placeholder="(918) 123-4567"
                      className={inputClass(
                        !!errors.phone
                      )}
                    />
                  </div>

                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-semibold text-gray-900"
                  >
                    Email Address
                  </label>

                  <div className="relative">
                    <Envelope
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    />

                    <input
                      id="email"
                      {...register("email")}
                      type="email"
                      placeholder="Alex@gmail.com"
                      className={inputClass(
                        !!errors.email
                      )}
                    />
                  </div>

                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-500">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Verifying..."
                : "Verify VIN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}