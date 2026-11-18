'use client';

import { CornerDownLeft, Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/cn';
import { usePaymentsData } from '@/features/payments/data/payments-data-provider';
import { formatAmount } from '@/features/payments/lib/format';
import { matchesSearch } from '@/features/payments/lib/pipeline';
import { shortenPaymentId } from '@/features/payments/lib/presentation';

const MAX_PAYMENTS = 5;
const MAX_CUSTOMERS = 3;

type Suggestion =
  | { kind: 'payment'; id: string; title: string; detail: string; href: string }
  | { kind: 'customer'; id: string; title: string; detail: string; href: string }
  | { kind: 'all'; id: string; title: string; detail: string; href: string };

/**
 * Dashboard-wide search in the top bar (distinct from the table search).
 * It suggests matching payments and customers and opens the payment
 * details or the Payments list filtered by the term. ⌘/Ctrl+K focuses it.
 */
export function GlobalSearch() {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { transactions } = usePaymentsData();
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const trimmed = term.trim();

  const suggestions = useMemo<readonly Suggestion[]>(() => {
    if (trimmed.length < 2) return [];

    const payments = transactions
      .filter((row) => matchesSearch(row, trimmed))
      .slice(0, MAX_PAYMENTS);
    const lowered = trimmed.toLowerCase();
    const customers = new Map<string, Suggestion>();

    for (const row of transactions) {
      if (customers.size >= MAX_CUSTOMERS) break;
      if (
        !customers.has(row.customer.id) &&
        (row.customer.email.includes(lowered) || row.customer.name.toLowerCase().includes(lowered))
      ) {
        customers.set(row.customer.id, {
          kind: 'customer',
          id: row.customer.id,
          title: row.customer.name,
          detail: row.customer.email,
          href: `/transactions/payments?q=${encodeURIComponent(row.customer.email)}`,
        });
      }
    }

    return [
      ...payments.map<Suggestion>((row) => ({
        kind: 'payment',
        id: row.id,
        title: `${formatAmount(row.amountMinor, row.currency)} ${row.currency}`,
        detail: `${shortenPaymentId(row.id)} · ${row.customer.email}`,
        href: `/transactions/payments/${row.id}`,
      })),
      ...customers.values(),
      {
        kind: 'all',
        id: 'all',
        title: `Search payments for “${trimmed}”`,
        detail: 'Payment ID, email or last 4 digits',
        href: `/transactions/payments?q=${encodeURIComponent(trimmed)}`,
      },
    ];
  }, [transactions, trimmed]);

  const go = (suggestion: Suggestion | undefined) => {
    if (!suggestion) return;

    setOpen(false);
    setTerm('');
    // Typed routes cannot express dynamic query strings; hrefs are built above.
    router.push(suggestion.href as Parameters<typeof router.push>[0]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex(
        (index) => (index + delta + suggestions.length) % Math.max(suggestions.length, 1),
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <Popover open={showList} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full max-w-[552px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList ? `${listId}-${activeIndex}` : undefined}
            aria-label="Search"
            placeholder="Search"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="h-[34px] w-full rounded-control bg-surface pr-3 pl-9 text-[15px] text-fg placeholder:text-fg-secondary focus-visible:bg-canvas focus-visible:shadow-[0_0_0_1px_var(--color-line-strong)]"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (event.target === inputRef.current) event.preventDefault();
        }}
      >
        <ul id={listId} role="listbox" aria-label="Search suggestions">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.kind}-${suggestion.id}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => go(suggestion)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-control px-2.5 py-1.5',
                index === activeIndex && 'bg-surface-hover',
              )}
            >
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-control bg-surface text-fg-muted">
                {suggestion.kind === 'customer' ? (
                  <User className="size-3.5" aria-hidden />
                ) : suggestion.kind === 'all' ? (
                  <Search className="size-3.5" aria-hidden />
                ) : (
                  <CornerDownLeft className="size-3.5" aria-hidden />
                )}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-medium">{suggestion.title}</span>
                <span className="truncate text-[12px] text-fg-muted">{suggestion.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
