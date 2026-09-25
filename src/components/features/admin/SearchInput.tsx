import { useEffect, useState } from "react";
import { Search } from "reicon-react";

const SEARCH_DEBOUNCE_MS = 400;

interface SearchInputProps {
  // The search currently applied (from Redux)
  value: string;
  // Called once typing pauses
  onSearch: (value: string) => void;
  placeholder: string;
}

// The input updates immediately; the search is applied once typing pauses
export function SearchInput({ value, onSearch, placeholder }: SearchInputProps) {
  const [input, setInput] = useState(value);
  const [appliedValue, setAppliedValue] = useState(value);

  // Follow outside changes to the search, e.g. "Clear filters"
  if (value !== appliedValue) {
    setAppliedValue(value);
    setInput(value);
  }

  useEffect(() => {
    if (input === value) return;

    const timer = setTimeout(() => onSearch(input), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input, value, onSearch]);

  return (
    <div className="relative min-w-[260px] flex-1">
      <Search
        size={17}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        type="search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
      />
    </div>
  );
}
