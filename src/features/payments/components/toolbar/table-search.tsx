'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 250;

/**
 * Payments table search (payment ID, customer email or last 4 digits).
 * Typing is debounced into the URL with history replacement, so it does
 * not flood the back button; external changes (clear filters, saved
 * filters, back/forward) are reflected in the input.
 */
export function TableSearch({
  value,
  onSearch,
}: {
  readonly value: string;
  readonly onSearch: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  const timer = useRef<number | undefined>(undefined);

  // Adopt external URL changes during render (no effect round trip).
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const schedule = (next: string) => {
    setDraft(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onSearch(next), DEBOUNCE_MS);
  };

  return (
    <div className="relative w-full sm:w-[180px]" role="search">
      <Search
        className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-fg-muted"
        aria-hidden
      />
      <input
        type="search"
        value={draft}
        onChange={(event) => schedule(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            window.clearTimeout(timer.current);
            onSearch(draft);
          }
        }}
        placeholder="Search payments"
        aria-label="Search payments by ID, email or last 4 digits"
        className="h-7 w-full rounded-control border border-line-strong bg-canvas pr-7 pl-7 text-[14px] text-fg shadow-control placeholder:text-fg-muted focus-visible:border-primary [&::-webkit-search-cancel-button]:hidden"
      />
      {draft !== '' ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            window.clearTimeout(timer.current);
            setDraft('');
            onSearch('');
          }}
          className="absolute top-1/2 right-1 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-fg-muted hover:bg-surface-hover hover:text-fg"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
