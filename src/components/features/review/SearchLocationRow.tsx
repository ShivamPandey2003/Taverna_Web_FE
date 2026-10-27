import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Pin, Search, X } from "reicon-react";
import { toast } from "sonner";
import { cn } from "@/libs/utils";
import type { AddressPlace, Coordinates } from "@/services/geocodeApi";
import { placeDetails, suggestPlaces, type PlaceSuggestion } from "@/services/placesApi";

export interface SearchedPlace {
  label: string;
  coordinates: Coordinates;
  place: AddressPlace;
}

interface SearchLocationRowProps {
  selected: boolean;
  // The place picked from the suggestions, if any
  picked: SearchedPlace | null;
  // Suggestions near here come first
  near: Coordinates | null;
  onSelect: () => void;
  onPick: (place: SearchedPlace) => void;
  disabled?: boolean;
}

const MIN_LETTERS = 3;
const DEBOUNCE_MS = 300;

// The location modal's "Search for an Address" option: a search box suggesting
// places as the customer types, like the landing page's pickup search
export function SearchLocationRow({
  selected,
  picked,
  near,
  onSelect,
  onPick,
  disabled = false,
}: SearchLocationRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<{ query: string; places: PlaceSuggestion[] } | null>(null);
  const [highlighted, setHighlighted] = useState(0);
  const [picking, setPicking] = useState(false);

  const query = text.trim();
  const searchable = focused && query.length >= MIN_LETTERS && query !== picked?.label;
  const answered = searchable && results?.query === query;
  const suggestions = answered ? results.places : [];

  useEffect(() => {
    if (!searchable) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      suggestPlaces(query, near, controller.signal)
        .catch(() => [])
        .then((places) => {
          if (controller.signal.aborted) return;
          setResults({ query, places });
          setHighlighted(0);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `near` only orders the results: a new position needn't search again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchable, query]);

  const pick = async (suggestion: PlaceSuggestion) => {
    setPicking(true);
    try {
      const { coordinates, place } = await placeDetails(suggestion);
      onPick({
        label: suggestion.label,
        coordinates,
        // A place with no street number (an area, a building) keeps its name
        place: { ...place, address: place.address || suggestion.main },
      });
      setText(suggestion.label);
      setResults(null);
      inputRef.current?.blur();
    } catch {
      toast.error("We couldn't find that place. Try another one.");
    } finally {
      setPicking(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && suggestions[highlighted]) {
      event.preventDefault();
      pick(suggestions[highlighted]);
    } else if (event.key === "Escape") {
      // Closes the list, not the modal
      event.stopPropagation();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative">
      <div
        data-test-id="location-search-row"
        onClick={() => {
          onSelect();
          inputRef.current?.focus();
        }}
        className={cn(
          "flex w-full cursor-text items-center gap-4 rounded-xl border px-3 py-2 transition",
          selected ? "border-gray-900" : "border-gray-200 hover:border-gray-300",
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-800">
          <Search size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <label htmlFor="location-search" className="block text-sm font-bold text-gray-900">
            Search for an Address
          </label>
          <input
            data-test-id="location-search-input"
            id="location-search"
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={searchable}
            aria-controls="location-search-suggestions"
            autoComplete="off"
            value={text}
            placeholder="Type a street, area or place"
            disabled={disabled || picking}
            onFocus={() => {
              onSelect();
              setFocused(true);
            }}
            onBlur={() => setFocused(false)}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKeyDown}
            className="w-full truncate bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>

        {text && !picking && (
          <button
            data-test-id="location-search-clear"
            type="button"
            aria-label="Clear"
            // Keeps the box focused
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              setText("");
              inputRef.current?.focus();
            }}
            className="shrink-0 text-gray-400 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        )}

        {picking ? (
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-gray-700" />
        ) : (
          <Radio selected={selected && !!picked} />
        )}
      </div>

      {searchable && (
        <ul
          id="location-search-suggestions"
          role="listbox"
          // A click mustn't blur the box before it lands
          onMouseDown={(event) => event.preventDefault()}
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li
              data-test-id={`location-suggestion-${suggestion.id}`}
              key={suggestion.id}
              role="option"
              aria-selected={highlighted === index}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => pick(suggestion)}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm",
                highlighted === index && "bg-gray-100",
              )}
            >
              <Pin size={16} className="shrink-0 text-gray-500" />
              <span className="min-w-0 truncate">
                <span className="font-semibold text-gray-900">{suggestion.main}</span>{" "}
                <span className="text-gray-500">{suggestion.secondary}</span>
              </span>
            </li>
          ))}

          {!answered && <li className="px-3 py-2.5 text-sm text-gray-500">Searching...</li>}
          {answered && suggestions.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-gray-500">No places found</li>
          )}
        </ul>
      )}
    </div>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <div
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
        selected ? "border-gray-900" : "border-gray-300",
      )}
    >
      {selected && <div className="h-2.5 w-2.5 rounded-full bg-gray-900" />}
    </div>
  );
}
