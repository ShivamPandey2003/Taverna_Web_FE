import { Camera, UserCircle } from 'reicon-react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/libs/utils";
import { useAppSelector } from "@/redux/hooks";
import { selectAccountUser } from "@/redux/account/accountSlice";
import { profileSchema, type ProfileFormData } from "@/schema/profile.schema";
import { useProfile, useUpdateProfile } from "@/services/queries/profileQueries";
import type { Profile } from "@/types/profile";

export function EditProfile() {
  const user = useAppSelector(selectAccountUser);
  const { data: profile, isPending, isError, isFetching, refetch } = useProfile();

  // If the profile didn't load (already toasted), the form still works from what
  // the login gave us: the one name split into first and last
  const [firstName = "", ...rest] = user.name.trim().split(/\s+/);
  const fallback: Profile = {
    firstName,
    lastName: rest.join(" "),
    email: user.email,
    phone: user.phone,
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

      {isError && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-900">
            We couldn't load your latest profile. What you see may be out of date.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-900 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching && <Spinner className="h-3 w-3" />}
            {isFetching ? "Retrying..." : "Try Again"}
          </button>
        </div>
      )}

      {isPending ? (
        <ProfileFormSkeleton />
      ) : (
        // Remounts when the profile arrives after a failed load, so the fields start from it
        <ProfileForm key={profile ? "loaded" : "fallback"} profile={profile ?? fallback} />
      )}
    </div>
  );
}

// The form's shape while the profile loads
function ProfileFormSkeleton() {
  return (
    <div className="mt-7 animate-pulse space-y-5" role="status" aria-label="Loading your profile">
      <div className="grid gap-5 sm:grid-cols-2">
        <SkeletonField />
        <SkeletonField />
      </div>
      <SkeletonField />
      <SkeletonField />
      <div className="h-11 rounded-lg bg-gray-200" />
    </div>
  );
}

function SkeletonField() {
  return (
    <div>
      <div className="mb-2 h-3 w-24 rounded bg-gray-200" />
      <div className="h-11 rounded-lg bg-gray-100" />
    </div>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const saving = updateProfile.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
    },
  });

  // A failure is toasted by the API layer; the fields keep what was typed
  const onSubmit = async (data: ProfileFormData) => {
    try {
      const saved = await updateProfile.mutateAsync(data);
      // What the server kept is the new starting point, so Save goes quiet again
      reset({ firstName: saved.firstName, lastName: saved.lastName, phone: saved.phone });
      toast.success("Profile updated");
    } catch {
      // already reported
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-7">
      {/* Locked while saving */}
      <fieldset disabled={saving} className={cn("space-y-5 transition", saving && "opacity-60")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="First Name" htmlFor="firstName" error={errors.firstName?.message}>
            <input
              id="firstName"
              {...register("firstName")}
              autoComplete="given-name"
              className="form-input"
            />
          </FormField>

          <FormField label="Last Name" htmlFor="lastName" error={errors.lastName?.message}>
            <input
              id="lastName"
              {...register("lastName")}
              autoComplete="family-name"
              className="form-input"
            />
          </FormField>
        </div>

        {/* Email: shown, never sent */}
        <FormField label="Email Address" htmlFor="email" description="Email cannot be changed.">
          <input
            id="email"
            type="email"
            value={profile.email}
            readOnly
            disabled
            className="form-input cursor-not-allowed bg-gray-50 text-gray-500"
          />
        </FormField>

        <FormField label="Phone Number" htmlFor="phone" error={errors.phone?.message}>
          <input
            id="phone"
            {...register("phone")}
            type="tel"
            autoComplete="tel"
            className="form-input"
          />
        </FormField>
      </fieldset>

      {/* Save: only once something changed */}
      <button
        type="submit"
        disabled={saving || !isDirty}
        className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving && <Spinner className="h-4 w-4" />}
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({
  label,
  htmlFor,
  description,
  error,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-xs font-semibold text-gray-600">
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
