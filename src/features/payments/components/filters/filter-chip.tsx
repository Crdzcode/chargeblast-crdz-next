'use client';

import { ChevronDown, CirclePlus, CircleX } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/cn';

export interface FilterChipProps {
  readonly label: string;
  /** Short active value, e.g. "Last 7 days"; null when the filter is inactive. */
  readonly summary: string | null;
  readonly onClear: () => void;
  /** Popover body; receives `close` so Apply can dismiss it. */
  readonly children: (close: () => void) => ReactNode;
  readonly panelTitle?: string;
}

/**
 * Stripe-style filter pill: dashed "⊕ Label" when inactive; solid
 * "⊗ Label | value ⌄" when active, with a separate clear button.
 */
export function FilterChip({ label, summary, onClear, children, panelTitle }: FilterChipProps) {
  const [open, setOpen] = useState(false);
  const active = summary !== null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span
        className={cn(
          'inline-flex h-[26px] shrink-0 items-center rounded-full border text-[13px] leading-[18px] font-semibold text-fg-secondary transition-colors duration-100',
          active
            ? 'border-line-strong bg-canvas'
            : 'border-dashed border-line-dashed hover:bg-surface',
        )}
      >
        {active ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={`Clear ${label} filter`}
            className="ml-1 inline-flex size-[18px] items-center justify-center rounded-full text-fg-muted hover:bg-surface-hover hover:text-fg"
          >
            <CircleX className="size-3.5" aria-hidden />
          </button>
        ) : null}
        <PopoverTrigger
          className={cn(
            'inline-flex h-full items-center gap-1.5 rounded-full pr-2.5 outline-offset-0',
            active ? 'pl-1' : 'pl-2',
          )}
        >
          {active ? null : <CirclePlus className="size-3.5 text-fg-muted" aria-hidden />}
          <span>{label}</span>
          {active ? (
            <>
              <span className="h-3 w-px bg-line-strong" aria-hidden />
              <span className="max-w-48 truncate text-primary-text">{summary}</span>
              <ChevronDown className="size-3.5 text-primary-text" aria-hidden />
            </>
          ) : null}
        </PopoverTrigger>
      </span>
      <PopoverContent className="w-[296px]" aria-label={panelTitle ?? `Filter by ${label}`}>
        <p className="border-b border-line px-4 pt-3 pb-2.5 text-[14px] font-semibold">
          {panelTitle ?? `Filter by ${label}`}
        </p>
        {open ? children(() => setOpen(false)) : null}
      </PopoverContent>
    </Popover>
  );
}

/** Footer with the full-width primary Apply button used by every filter panel. */
export function FilterApplyFooter({ disabled = false }: { readonly disabled?: boolean }) {
  return (
    <div className="border-t border-line p-3">
      <Button type="submit" variant="primary" className="w-full" disabled={disabled}>
        Apply
      </Button>
    </div>
  );
}
