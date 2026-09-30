import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  signupSchema,
  type SignupFormData,
} from "@/schema/auth.schema";

import { AuthInput } from "./AuthInput";

interface SignupFormProps {
  onSubmit: (data: SignupFormData) => void;
}

export function SignupForm({
  onSubmit,
}: SignupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),

    defaultValues: {
      fullname: "",
      email: "",
      phone: "",
      notification_preferences: true,
      privacy_policy: false,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <AuthInput
        label="Full name"
        placeholder="Sagar Kumar"
        autoComplete="name"
        {...register("fullname")}
        error={errors.fullname?.message}
      />

      <AuthInput
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        {...register("email")}
        error={errors.email?.message}
      />

      <AuthInput
        label="Phone number"
        type="tel"
        placeholder="9170579911"
        autoComplete="tel"
        {...register("phone")}
        error={errors.phone?.message}
      />

      {/* Notifications */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          {...register("notification_preferences")}
          className="mt-0.5 h-4 w-4 accent-primary"
        />

        <span className="text-xs leading-5 text-gray-600">
          I'd like to receive service updates, offers and
          other notifications from Taverna.
        </span>
      </label>

      {/* Privacy */}
      <div>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            {...register("privacy_policy")}
            className="mt-0.5 h-4 w-4 accent-primary"
          />

          <span className="text-xs leading-5 text-gray-600">
            I agree to Taverna's{" "}
            <a
              href="/privacy"
              target="_blank"
              className="font-semibold text-gray-900 underline"
            >
              Privacy Policy
            </a>
            .
          </span>
        </label>

        {errors.privacy_policy && (
          <p className="mt-1.5 text-xs text-red-500">
            {errors.privacy_policy.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting
          ? "Creating account..."
          : "Create account"}
      </button>
    </form>
  );
}