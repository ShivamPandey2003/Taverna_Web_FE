import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/libs/utils";

export interface FieldSuggestion {
  id: string;
  main: string;
  secondary?: string;
}

interface SuggestFieldProps<T extends FieldSuggestion> {
  label: ReactNode;
  id: string;
  placeholder: string;
  icon: ReactNode;
  registration: UseFormRegisterReturn;
  // What's in the field now (watched from the form)
  value: string;
  error?: string;
  // Suggestions for what's typed; called after a short pause in typing
  suggest: (text: string, signal: AbortSignal) => Promise<T[]>;
  onPick: (suggestion: T) => void;
  // Fewer letters than this aren't searched
  minLetters?: number;
  debounceMs?: number;
  // "above" for fields near the bottom of a scrolling form, where a list
  // opening downwards would be cut off
  placement?: "below" | "above";
  // Locked: shows its value, can't be typed in and suggests nothing
  readOnly?: boolean;
  // A grey line under the field (an error takes its place)
  hint?: string;
}

// An address form field that suggests as the customer types, like the landing
// page's pickup search: arrow keys move, Enter picks, Esc closes. Suggestions
// only show once the field has been typed in, not for what the form filled in.
export function SuggestField<T extends FieldSuggestion>({
  label,
  id,
  placeholder,
  icon,
  registration,
  value,
  error,
  suggest,
  onPick,
  minLetters = 3,
  debounceMs = 300,
  placement = "below",
  readOnly = false,
  hint,
}: SuggestFieldProps<T>) {
  const [focused, setFocused] = useState(false);
  // Typed in since it was focused or last picked
  const [typed, setTyped] = useState(false);
  // The last search's answer, kept with what it was for
  const [results, setResults] = useState<{ query: string; items: T[] } | null>(null);
  const [highlighted, setHighlighted] = useState(0);

  const query = value.trim();
  const searchable = !readOnly && focused && typed && query.length >= minLetters;
  const answered = searchable && results?.query === query;
  const items = answered ? results.items : [];
  const open = searchable;

  useEffect(() => {
    if (!searchable) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      suggest(query, controller.signal)
        .catch(() => [] as T[])
        .then((found) => {
          if (controller.signal.aborted) return;
          setResults({ query, items: found });
          setHighlighted(0);
        });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `suggest` is rebuilt each render; only what's typed starts a new search
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchable, query]);

  const pick = (suggestion: T) => {
    setTyped(false);
    setResults(null);
    onPick(suggestion);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => Math.min(index + 1, items.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && items[highlighted]) {
      // Picks the suggestion instead of submitting the form
      event.preventDefault();
      pick(items[highlighted]);
    } else if (event.key === "Escape") {
      // Closes the list, not the modal
      event.stopPropagation();
      setTyped(false);
    }
  };

  const listId = `${id}-suggestions`;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[10px] font-semibold text-gray-600">
        {label}
      </label>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>

        <input
          data-test-id={`address-field-${id}`}
          id={id}
          {...registration}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          // The browser's own suggestions would cover ours
          autoComplete="off"
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(event) => {
            setTyped(true);
            return registration.onChange(event);
          }}
          onFocus={() => setFocused(true)}
          onBlur={(event) => {
            setFocused(false);
            setTyped(false);
            return registration.onBlur(event);
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "h-9 w-full rounded-lg border bg-gray-50 pl-9 pr-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100",
            error ? "border-red-400" : "border-gray-200",
            readOnly && lockedFieldClass,
          )}
        />

        {open && (
          <ul
            id={listId}
            role="listbox"
            // A click mustn't blur the field before it lands
            onMouseDown={(event) => event.preventDefault()}
            className={cn(
              "absolute left-0 right-0 z-30 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg",
              placement === "above" ? "bottom-full mb-1" : "top-full mt-1",
            )}
          >
            {items.map((item, index) => (
              <li
                data-test-id={`address-suggestion-${item.id}`}
                key={item.id}
                role="option"
                aria-selected={highlighted === index}
                onMouseEnter={() => setHighlighted(index)}
                onClick={() => pick(item)}
                className={cn(
                  "cursor-pointer truncate px-3 py-2 text-xs",
                  highlighted === index && "bg-gray-100",
                )}
              >
                <span className="font-semibold text-gray-900">{item.main}</span>
                {item.secondary && <span className="text-gray-500"> {item.secondary}</span>}
              </li>
            ))}

            {!answered && <li className="px-3 py-2 text-xs text-gray-500">Searching...</li>}
            {answered && items.length === 0 && (
              <li className="px-3 py-2 text-xs text-gray-500">No suggestions. Keep typing.</li>
            )}
          </ul>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-[10px] text-red-500">{error}</p>
      ) : (
        hint && <p className="mt-1 text-[10px] text-gray-500">{hint}</p>
      )}
    </div>
  );
}

// A field filled from the picked address, which can't be typed in
export const lockedFieldClass =
  "cursor-default bg-gray-100 text-gray-700 focus:border-gray-200 focus:bg-gray-100 focus:ring-0";
