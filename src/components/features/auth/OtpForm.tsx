import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema, type OtpFormData } from "@/schema/auth.schema";


interface OtpFormProps {
  email: string;
  onSubmit: (data: OtpFormData) => void;
  onBack: () => void;
}

export function OtpForm({
  email,
  onSubmit,
  onBack,
}: OtpFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          ← Back
        </button>

        <h2 className="text-2xl font-bold tracking-tight">
          Check your email
        </h2>

        <p className="mt-2 text-sm leading-5 text-gray-500">
          We sent a 6-digit verification code to
        </p>

        <p className="mt-1 text-sm font-semibold text-gray-900">
          {email}
        </p>
      </div>

      <div>
        <input
          {...register("otp")}
          ref={(element) => {
            register("otp").ref(element);
            inputRef.current = element;
          }}
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          className="h-14 w-full rounded-lg border border-gray-200 text-center text-2xl font-bold tracking-[0.5em] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        />

        {errors.otp && (
          <p className="mt-2 text-xs text-center text-red-500">
            {errors.otp.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-lg bg-black text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isSubmitting
          ? "Verifying..."
          : "Verify & continue"}
      </button>

      <button
        type="button"
        className="w-full text-sm font-semibold text-gray-600 hover:text-gray-900"
      >
        Didn't receive the code?{" "}
        <span className="text-primary">
          Resend
        </span>
      </button>
    </form>
  );
}