'use client';

import { CornerDownLeft, Search, User, X } from 'lucide-react';
import type { Route } from 'next';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';

import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/cn';

import { usePaymentsData } from '../data/payments-data-provider';
import { readPaymentsQueryFromLocation, writePaymentsQuery } from '../hooks/use-payments-query';
import { formatAmount } from '../lib/format';
import { matchesSearch } from '../lib/pipeline';
import { shortenPaymentId } from '../lib/presentation';
import { PAYMENTS_PATH, paymentHref, paymentsSearchHref } from '../routes';

const MAX_PAYMENTS = 5;
const MAX_CUSTOMERS = 3;

type Suggestion =
  | { kind: 'search'; id: string; title: string; detail: string; term: string }
  | { kind: 'payment' | 'customer'; id: string; title: string; detail: string; href: Route };

const SUGGESTION_ICONS = { search: Search, payment: CornerDownLeft, customer: User };

function SuggestionIcon({ kind }: { kind: Suggestion['kind'] }) {
  const Icon = SUGGESTION_ICONS[kind];

  return <Icon className="size-3.5" aria-hidden />;
}

/**
 * The search field in the top bar. Enter filters the payments list (the term
 * goes in the URL as `q`); a suggestion opens that payment, or that
 * customer's payments.
 */
export function GlobalSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { transactions } = usePaymentsData();
  const onPaymentsList = pathname === PAYMENTS_PATH;
  const listTerm = onPaymentsList ? (searchParams.get('q') ?? '') : null;

  const [term, setTerm] = useState(listTerm ?? '');
  const [syncedTerm, setSyncedTerm] = useState(listTerm);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const trimmed = term.trim();

  // Pick up the term when the URL changes under us (chip removed, Back,
  // saved filter). Setting state during render saves an effect pass.
  if (listTerm !== syncedTerm) {
    setSyncedTerm(listTerm);

    if (listTerm !== null) {
      setTerm(listTerm);
    }
  }

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
          href: paymentsSearchHref(row.customer.email),
        });
      }
    }

    return [
      {
        kind: 'search',
        id: 'search',
        title: `Search payments for “${trimmed}”`,
        detail: 'Payment ID, email or last 4 digits',
        term: trimmed,
      },
      ...payments.map<Suggestion>((row) => ({
        kind: 'payment',
        id: row.id,
        title: `${formatAmount(row.amountMinor, row.currency)} ${row.currency}`,
        detail: `${shortenPaymentId(row.id)} · ${row.customer.email}`,
        href: paymentHref(row.id),
      })),
      ...customers.values(),
    ];
  }, [transactions, trimmed]);

  /** An empty value clears the search. Other filters are kept. */
  const applySearch = (value: string) => {
    setOpen(false);

    if (onPaymentsList) {
      writePaymentsQuery({ ...readPaymentsQueryFromLocation(), search: value, page: 1 });
    } else if (value !== '') {
      router.push(paymentsSearchHref(value));
    }
  };

  const choose = (suggestion: Suggestion | undefined) => {
    if (!suggestion) {
      applySearch(trimmed);
      return;
    }

    if (suggestion.kind === 'search') {
      applySearch(suggestion.term);
      return;
    }

    setOpen(false);
    setTerm('');
    router.push(suggestion.href);
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
      choose(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <Popover open={showList} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full max-w-[552px]" role="search">
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
            aria-label="Search payments by ID, email or last 4 digits"
            placeholder="Search"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setActiveIndex(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="h-[34px] w-full rounded-control bg-surface pr-8 pl-9 text-[15px] text-fg placeholder:text-fg-secondary focus-visible:bg-canvas focus-visible:shadow-[0_0_0_1px_var(--color-line-strong)]"
          />
          {term !== '' ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setTerm('');
                applySearch('');
                inputRef.current?.focus();
              }}
              className="absolute top-1/2 right-2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-fg-muted hover:bg-surface-hover hover:text-fg"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
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
              onClick={() => choose(suggestion)}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-control px-2.5 py-1.5',
                index === activeIndex && 'bg-surface-hover',
              )}
            >
              <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-control bg-surface text-fg-muted">
                <SuggestionIcon kind={suggestion.kind} />
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
