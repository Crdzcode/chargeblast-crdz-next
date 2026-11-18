'use client';

import { cn } from '@/lib/cn';

import { STATUS_VIEWS, STATUS_VIEW_LABELS, type StatusView } from '../model/query';

/** The six wide quick-view cards of the reference (All … Uncaptured). */
export function StatusViewCards({
  value,
  onChange,
}: {
  readonly value: StatusView;
  readonly onChange: (view: StatusView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Payment views"
      className="-mx-4 scrollbar-none flex gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0"
    >
      {STATUS_VIEWS.map((view) => {
        const selected = view === value;

        return (
          <button
            key={view}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(view)}
            className={cn(
              'h-11 min-w-[132px] shrink-0 rounded-card border bg-canvas px-3 text-left text-[14px] font-medium transition-[border-color,box-shadow,background-color] duration-100 md:min-w-0',
              selected
                ? 'border-primary text-primary-text shadow-[0_0_0_1px_var(--color-primary)]'
                : 'border-line-strong text-fg-secondary hover:bg-surface',
            )}
          >
            {STATUS_VIEW_LABELS[view]}
          </button>
        );
      })}
    </div>
  );
}
