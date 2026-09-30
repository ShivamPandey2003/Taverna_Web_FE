import { Camera, UserCircle } from 'reicon-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAccountUser, updateProfile } from "@/redux/account/accountSlice";
import { authApi } from "@/services/authApi";

const profileSchema = z.object({
  fullname: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),

  email: z
    .email("Please enter a valid email"),

  phone: z
    .string()
    .min(10, "Please enter a valid phone number"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function EditProfile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAccountUser);

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),

    defaultValues: {
      fullname: user.name,
      email: user.email,
      phone: user.phone,
    },
  });

  const onSubmit = async (
    data: ProfileFormData
  ) => {
    try {
      const updated = await authApi.updateMe({
        name: data.fullname,
        phone: data.phone,
      });

      dispatch(
        updateProfile({
          name: updated.name,
          phone: updated.phone,
        })
      );
      toast.success("Profile updated");
    } catch {
      // already reported by the API layer
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 lg:p-8">
      <h2 className="text-base font-bold text-gray-900">
        Edit Profile
      </h2>

      {/* Profile photo */}
      <div className="mt-7 flex flex-col items-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-black text-white">
            <UserCircle
              size={38}
              strokeWidth={1.5}
            />
          </div>

          <button
            type="button"
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-700 shadow-sm transition hover:bg-gray-300"
            aria-label="Change profile photo"
          >
            <Camera size={14} />
          </button>
        </div>

        <button
          type="button"
          className="mt-3 text-xs font-semibold text-gray-900 hover:underline"
        >
          Change Photo
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-7 space-y-5"
      >
        {/* Full Name */}
        <FormField
          label="Full Name"
          error={errors.fullname?.message}
        >
          <input
            {...register("fullname")}
            className="form-input"
          />
        </FormField>

        {/* Email */}
        <FormField
          label="Email Address"
          error={errors.email?.message}
          description="Email cannot be changed."
        >
          <input
            {...register("email")}
            type="email"
            disabled
            className="form-input cursor-not-allowed bg-gray-50 text-gray-500"
          />
        </FormField>

        {/* Phone */}
        <FormField
          label="Phone Number"
          error={errors.phone?.message}
        >
          <input
            {...register("phone")}
            type="tel"
            className="form-input"
          />
        </FormField>

        {/* Save */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 w-full rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({
  label,
  description,
  error,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-gray-600">
        {label}
      </label>

      {children}

      {description && !error && (
        <p className="mt-1.5 text-xs text-gray-400">
          {description}
        </p>
      )}

      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}