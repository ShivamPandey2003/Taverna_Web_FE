import type { ReactNode } from "react";

interface FormFieldProps {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
}

// Label + control + validation message, for use with the .form-input class
export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-xs font-semibold text-gray-600">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
