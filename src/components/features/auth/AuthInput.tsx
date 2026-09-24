import { cn } from "@/libs/utils";

interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function AuthInput({
  label,
  error,
  className,
  ...props
}: AuthInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-800">
        {label}
      </label>

      <input
        {...props}
        className={cn(
          "h-11 w-full rounded-lg border bg-white px-3.5 text-sm",
          "outline-none transition",
          "placeholder:text-gray-400",
          "focus:border-primary focus:ring-2 focus:ring-primary/10",
          error
            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
            : "border-gray-200",
          className
        )}
      />

      {error && (
        <p className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}