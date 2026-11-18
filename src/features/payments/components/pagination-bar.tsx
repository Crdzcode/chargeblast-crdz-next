'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

import { formatCount } from '../lib/format';
import type { Pagination } from '../lib/pipeline';
import { PAGE_SIZES, type PageSize } from '../model/query';

/** "Viewing 1–25 of 964 results", the rows-per-page select and Previous / Next. */
export function PaginationBar({
  pagination,
  onPageChange,
  onPageSizeChange,
  selection = null,
}: {
  readonly pagination: Pagination;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (size: PageSize) => void;
  /** Optional selection summary shown next to the result count. */
  readonly selection?: ReactNode;
}) {
  const { firstItem, lastItem, totalItems, page, totalPages } = pagination;

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-3"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="text-[14px] text-fg tabular" aria-live="polite">
          {totalItems === 0 ? (
            'No results'
          ) : (
            <>
              Viewing{' '}
              <span className="font-semibold">
                {formatCount(firstItem)}–{formatCount(lastItem)}
              </span>{' '}
              of <span className="font-semibold">{formatCount(totalItems)}</span> results
            </>
          )}
        </p>
        {selection}
      </div>
      <div className="flex items-center gap-2">
        <select
          aria-label="Rows per page"
          value={pagination.pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}
          className="h-6 rounded-control border border-line-strong bg-canvas pr-1 pl-1.5 text-[13px] font-semibold text-fg shadow-control"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} rows
            </option>
          ))}
        </select>
        <span className="sr-only">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button
          size="xs"
          disabled={!pagination.hasPreviousPage}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button size="xs" disabled={!pagination.hasNextPage} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
