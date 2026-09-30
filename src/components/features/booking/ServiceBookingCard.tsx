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
        "flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5",
        disabled && "opacity-50",
      )}
    >
      {/* Main content */}
      <div className="flex flex-col gap-5 sm:flex-row">
        {/* Image */}
        <div className="h-[140px] w-full shrink-0 overflow-hidden rounded-xl sm:h-[120px] sm:w-[160px]">
          <img
            src={service.image}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
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
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <Check
                    size={11}
                    strokeWidth={3}
                    className="text-black"
                  />
                </span>

                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Pinned to the bottom so both cards' buttons line up */}
      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={() => onSelect?.(service)}
          disabled={disabled}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:hover:bg-black"
        >
          {service.buttonText}
          <ArrowRight size={16} />
        </button>
      </div>
    </article>
  );
}
