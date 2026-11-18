'use client';

import { BarChart3, Plus, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Unavailable } from '@/components/ui/unavailable';
import { cn } from '@/lib/cn';

/** "Transactions" title with the reference's primary and secondary actions. */
export function PaymentsPageHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-[28px] leading-9 font-bold tracking-[-0.01em] text-fg">Transactions</h1>
      <div className="flex items-center gap-2">
        <Unavailable>
          <Button variant="primary" aria-disabled="true">
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            Create payment
          </Button>
        </Unavailable>
        <Unavailable>
          <Button aria-disabled="true">
            <BarChart3 className="size-3.5" aria-hidden />
            Analyze
          </Button>
        </Unavailable>
      </div>
    </div>
  );
}

const TABS = [
  'Payments',
  'Payouts',
  'Top-ups',
  'Collected fees',
  'Transfers',
  'All activity',
] as const;

/** Transactions sub-navigation; only Payments exists in this demo. */
export function TransactionsTabs() {
  return (
    <nav aria-label="Transactions" className="border-b border-line-strong">
      <ul className="-mb-px scrollbar-none flex gap-6 overflow-x-auto">
        {TABS.map((tab) => {
          const current = tab === 'Payments';
          const className = cn(
            'inline-flex h-9 items-center border-b-2 pb-0.5 text-[14px] font-semibold whitespace-nowrap',
            current
              ? 'border-primary text-primary-text'
              : 'border-transparent text-fg-secondary hover:text-fg',
          );

          return (
            <li key={tab}>
              {current ? (
                <span aria-current="page" className={className}>
                  {tab}
                </span>
              ) : (
                <Unavailable>
                  <button type="button" aria-disabled="true" className={className}>
                    {tab}
                  </button>
                </Unavailable>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Dismissible "New" announcement from the reference (session only). */
export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <aside
      aria-label="Announcement"
      className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1 rounded-card bg-surface py-1.5 pr-1.5 pl-2.5"
    >
      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
        <Sparkles className="size-3.5" aria-hidden />
        New
      </span>
      <p className="min-w-0 flex-1 text-[14px] text-fg">
        Rule Attributes are now in Sigma and Data Pipeline for better fraud insights.
      </p>
      <Unavailable>
        <button
          type="button"
          aria-disabled="true"
          className="text-[14px] font-medium text-primary-text hover:underline"
        >
          Get started
        </button>
      </Unavailable>
      <span className="h-5 w-px bg-line-strong" aria-hidden />
      <button
        type="button"
        aria-label="Dismiss announcement"
        onClick={() => setDismissed(true)}
        className="inline-flex size-7 items-center justify-center rounded-control text-fg hover:bg-surface-hover"
      >
        <X className="size-4" aria-hidden />
      </button>
    </aside>
  );
}
