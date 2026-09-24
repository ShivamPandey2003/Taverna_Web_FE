import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthInput } from "./AuthInput";
import { loginSchema, type LoginFormData } from "@/schema/auth.schema";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      <AuthInput
        label="Email address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        {...register("email")}
        error={errors.email?.message}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-11 w-full rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Sending OTP..."
          : "Continue with email"}
      </button>

      <p className="text-center text-xs leading-5 text-gray-500">
        We'll send a one-time password to your email.
      </p>
    </form>
  );
}