import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Location, Pin, Search, X } from "reicon-react";
import { toast } from "sonner";
import { cn } from "@/libs/utils";
import type { Coordinates } from "@/services/geocodeApi";
import { placeCoordinates, suggestPlaces, type PlaceSuggestion } from "@/services/placesApi";

export interface PickedPlace {
  label: string;
  coordinates: Coordinates;
}

interface PickupSearchProps {
  // The pickup shown while the box isn't being typed in
  value: string;
  placeholder: string;
  // Suggestions near here come first
  near: Coordinates | null;
  onPick: (place: PickedPlace) => void;
  onUseCurrentLocation: () => void;
}

// Fewer letters than this match half the world
const MIN_LETTERS = 3;
const DEBOUNCE_MS = 300;

// The landing page's pickup: shows the found address and, once clicked, turns
// into a search box suggesting places as the visitor types, as Google Maps does
export function PickupSearch({ value, placeholder, near, onPick, onUseCurrentLocation }: PickupSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  // The last search's answer, kept with what it was for
  const [results, setResults] = useState<{ query: string; places: PlaceSuggestion[] } | null>(null);
  const [picking, setPicking] = useState(false);
  // -1 is "Use current location", the list's first row
  const [highlighted, setHighlighted] = useState(-1);

  const query = text.trim();
  const searchable = editing && query.length >= MIN_LETTERS && text !== value;
  const answered = searchable && results?.query === query;
  const searching = searchable && !answered;
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
          setHighlighted(places.length ? 0 : -1);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // `near` only orders the results: a new position needn't search again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchable, query]);

  const startEditing = () => {
    setText(value);
    setEditing(true);
    setHighlighted(-1);
    // Select it all so typing replaces it
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const stopEditing = () => {
    setEditing(false);
    setResults(null);
  };

  const pick = async (suggestion: PlaceSuggestion) => {
    setPicking(true);
    try {
      const coordinates = await placeCoordinates(suggestion);
      onPick({ label: suggestion.label, coordinates });
      stopEditing();
      inputRef.current?.blur();
    } catch {
      toast.error("We couldn't find that place. Try another one.");
    } finally {
      setPicking(false);
    }
  };

  const pickCurrentLocation = () => {
    onUseCurrentLocation();
    stopEditing();
    inputRef.current?.blur();
  };

  const choose = (index: number) => {
    if (index === -1) pickCurrentLocation();
    else if (suggestions[index]) pick(suggestions[index]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => Math.max(index - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(highlighted);
    } else if (event.key === "Escape") {
      stopEditing();
      inputRef.current?.blur();
    }
  };

  const showNoMatches = answered && suggestions.length === 0;

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2 text-sm sm:gap-1">
        <label htmlFor="pickup-search" className="hidden shrink-0 sm:block">
          Pickup from
        </label>

        <input
          data-test-id="pickup-search-input"
          id="pickup-search"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={editing}
          aria-controls="pickup-suggestions"
          aria-label="Pickup from"
          autoComplete="off"
          value={editing ? text : value}
          placeholder={placeholder}
          disabled={picking}
          onFocus={startEditing}
          onBlur={stopEditing}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 truncate bg-transparent font-bold outline-none placeholder:font-normal placeholder:text-gray-500"
        />

        {editing && text && (
          <button
            data-test-id="pickup-search-clear"
            type="button"
            aria-label="Clear"
            // Keeps the box focused
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setText("")}
            className="shrink-0 cursor-pointer text-gray-500 hover:text-gray-800"
          >
            <X size={18} />
          </button>
        )}

        {!editing && (
          <Search size={18} className="shrink-0 text-gray-500" aria-hidden />
        )}
      </div>

      {editing && (
        <ul
          id="pickup-suggestions"
          role="listbox"
          // A click mustn't blur the box before it lands
          onMouseDown={(event) => event.preventDefault()}
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white py-2 shadow-lg"
        >
          <SuggestionRow
            testId="pickup-suggestion-current-location"
            active={highlighted === -1}
            icon={<Location size={20} className="text-primary" />}
            onHover={() => setHighlighted(-1)}
            onClick={pickCurrentLocation}
          >
            <span className="font-semibold text-primary">Use current location</span>
          </SuggestionRow>

          {suggestions.map((suggestion, index) => (
            <SuggestionRow
              testId={`pickup-suggestion-${suggestion.id}`}
              key={suggestion.id}
              active={highlighted === index}
              icon={<Pin size={20} className="text-gray-500" />}
              onHover={() => setHighlighted(index)}
              onClick={() => pick(suggestion)}
            >
              <span className="font-semibold text-gray-900">{suggestion.main}</span>{" "}
              <span className="text-gray-500">{suggestion.secondary}</span>
            </SuggestionRow>
          ))}

          {searching && <li className="px-4 py-3 text-sm text-gray-500">Searching...</li>}
          {showNoMatches && <li className="px-4 py-3 text-sm text-gray-500">No places found</li>}
          {editing && query.length < MIN_LETTERS && (
            <li className="px-4 py-3 text-sm text-gray-500">Type an address, area or place</li>
          )}
        </ul>
      )}
    </>
  );
}

interface SuggestionRowProps {
  active: boolean;
  icon: ReactNode;
  onHover: () => void;
  onClick: () => void;
  children: ReactNode;
  testId: string;
}

function SuggestionRow({ active, icon, onHover, onClick, children, testId }: SuggestionRowProps) {
  return (
    <li
      data-test-id={testId}
      role="option"
      aria-selected={active}
      onMouseEnter={onHover}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-center gap-4 px-4 py-3 text-sm",
        active && "bg-gray-100",
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </li>
  );
}
