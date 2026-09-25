import { ArrowRight, Check } from 'reicon-react';

import type { Service } from "@/types/service";
import { cn } from "@/libs/utils";

interface ServiceBookingCardProps {
  service: Service;
  onSelect?: (service: Service) => void;
  disabled?: boolean;
}

export function ServiceBookingCard({
  service,
  onSelect,
  disabled = false,
}: ServiceBookingCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-gray-200 bg-white px-6 py-6",
        disabled && "opacity-50",
      )}
    >
      {/* Main content */}
      <div className="flex gap-6">
        {/* Image */}
        <div className="h-[120px] w-[180px] shrink-0 overflow-hidden rounded-xl">
          <img
            src={service.image}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {service.title}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {service.description}
              </p>

              <ul className="mt-3 space-y-1.5">
                {service.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-gray-500"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                      <Check
                        size={11}
                        strokeWidth={3}
                        className="text-emerald-600"
                      />
                    </span>

                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Arrow */}
            <button
              type="button"
              onClick={() => onSelect?.(service)}
              disabled={disabled}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:hover:bg-gray-50"
              aria-label={`Book ${service.title}`}
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 border-t border-gray-200 pt-5">
        <button
          type="button"
          onClick={() => onSelect?.(service)}
          disabled={disabled}
          className="ml-auto block text-sm font-semibold text-gray-900 hover:text-emerald-600 disabled:cursor-not-allowed disabled:hover:text-gray-900"
        >
          Tap to book this service
        </button>
      </div>
    </article>
  );
}