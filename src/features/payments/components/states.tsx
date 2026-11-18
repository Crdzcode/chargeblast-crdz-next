import { CircleAlert, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** No payment matches the filters, or there are no payments at all. */
export function EmptyState({
  filtered,
  onClearFilters,
}: {
  readonly filtered: boolean;
  readonly onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 border-y border-t-line-strong border-b-line px-4 py-16 text-center">
      <span className="mb-1 inline-flex size-9 items-center justify-center rounded-full bg-surface text-fg-muted">
        <Search className="size-4" aria-hidden />
      </span>
      <h2 className="text-[16px] font-semibold">
        {filtered ? 'No results found' : 'No payments yet'}
      </h2>
      <p className="max-w-sm text-[14px] text-fg-secondary">
        {filtered
          ? 'No payments match the current filters. Try changing or clearing them.'
          : 'Payments will appear here once customers start paying.'}
      </p>
      {filtered ? (
        <Button className="mt-2" onClick={onClearFilters}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  onRetry,
  title = 'Payments could not be loaded',
  message = 'Something went wrong while loading payment data.',
}: {
  readonly onRetry: () => void;
  readonly title?: string;
  readonly message?: string;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 border-y border-line px-4 py-16 text-center"
    >
      <CircleAlert className="mb-1 size-6 text-danger-fg" aria-hidden />
      <h2 className="text-[16px] font-semibold">{title}</h2>
      <p className="max-w-sm text-[14px] text-fg-secondary">{message}</p>
      <Button className="mt-2" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

/** Placeholder rows while the page loads. */
export function TableSkeleton({ rows = 12 }: { readonly rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading payments" role="status">
      <div className="h-9 border-y border-t-line-strong border-b-line" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-9 items-center gap-6 border-b border-line pl-1">
          <Skeleton className="size-4" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="hidden h-3.5 w-44 md:block" />
          <Skeleton className="hidden h-3.5 w-24 lg:block" />
        </div>
      ))}
    </div>
  );
}
