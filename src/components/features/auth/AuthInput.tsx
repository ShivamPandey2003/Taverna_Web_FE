import { cn } from "@/libs/utils";

interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  // Fixed text shown inside the field before what's typed (e.g. "+1")
  leadingText?: string;
}

export function AuthInput({
  label,
  error,
  leadingText,
  className,
  ...props
}: AuthInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-800">
        {label}
      </label>

      <div className="relative">
        {leadingText && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center border-r border-gray-200 px-3.5 text-sm font-medium text-gray-700">
            {leadingText}
          </span>
        )}

        <input
          {...props}
          className={cn(
            "h-11 w-full rounded-lg border bg-white px-3.5 text-sm",
            "outline-none transition",
            "placeholder:text-gray-400",
            "focus:border-primary focus:ring-2 focus:ring-primary/10",
            leadingText && "pl-16",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-100"
              : "border-gray-200",
            className
          )}
        />
      </div>

      {error && (
        <p className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}