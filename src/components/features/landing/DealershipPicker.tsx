import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AngleDown, Building, Check } from "reicon-react";
import { cn } from "@/libs/utils";
import { distanceMiles, type Coordinates } from "@/services/dealershipApi";
import type { Dealership } from "@/types/dealership";

interface DealershipPickerProps {
  // Closest first; the first one is "Closest"
  dealerships: Dealership[];
  selected: Dealership;
  // Distances are measured from here
  pickup: Coordinates | null;
  onSelect: (dealership: Dealership) => void;
}

const milesTo = (pickup: Coordinates | null, dealership: Dealership) =>
  pickup ? `${distanceMiles(pickup, dealership).toFixed(1)} mi` : null;

// The landing page's "Deliver to": the closest dealership, which the visitor can
// swap for any other nearby one from a dropdown under the row
export function DealershipPicker({ dealerships, selected, pickup, onSelect }: DealershipPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(
    0,
    dealerships.findIndex((dealership) => dealership.id === selected.id),
  );
  const [highlighted, setHighlighted] = useState(selectedIndex);
  const isClosest = dealerships[0]?.id === selected.id;

  // A click anywhere else closes it
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = () => {
    setHighlighted(selectedIndex);
    setOpen((value) => !value);
  };

  const choose = (dealership: Dealership) => {
    onSelect(dealership);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        toggle();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => Math.min(index + 1, dealerships.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (dealerships[highlighted]) choose(dealerships[highlighted]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  // Only one to choose from: nothing to open
  const single = dealerships.length < 2;

  return (
    <div ref={rootRef} className="min-w-0 flex-1">
      <button
        type="button"
        onClick={single ? undefined : toggle}
        onKeyDown={single ? undefined : onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="dealership-options"
        aria-label={`Deliver to ${selected.name}${single ? "" : ". Change dealership"}`}
        className={cn(
          "flex w-full min-w-0 items-center gap-2 text-left text-sm sm:gap-3",
          !single && "cursor-pointer",
        )}
      >
        <span className="hidden shrink-0 sm:block">Deliver to</span>

        <strong className="line-clamp-2 min-w-0 flex-1 break-words sm:line-clamp-1">
          {selected.name}
        </strong>

        {isClosest && (
          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-primary">
            Closest
          </span>
        )}

        {!single && (
          <AngleDown
            size={18}
            className={cn("shrink-0 text-gray-500 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        )}
      </button>

      {open && (
        <ul
          id="dealership-options"
          role="listbox"
          aria-label="Dealerships"
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-2 shadow-lg"
        >
          {dealerships.map((dealership, index) => {
            const isSelected = dealership.id === selected.id;
            const miles = milesTo(pickup, dealership);

            return (
              <li
                key={dealership.id}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => choose(dealership)}
                className={cn(
                  "flex cursor-pointer items-center gap-4 px-4 py-3 text-sm",
                  highlighted === index && "bg-gray-100",
                )}
              >
                <Building size={20} className="shrink-0 text-gray-500" />

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold text-gray-900">{dealership.name}</span>
                    {index === 0 && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        Closest
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-gray-500">
                    {[miles, dealership.address].filter(Boolean).join(" · ")}
                  </span>
                </span>

                {isSelected && <Check size={18} className="shrink-0 text-primary" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
