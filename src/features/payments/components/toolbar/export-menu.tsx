'use client';

import { Share } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadTextFile } from '@/lib/download';

import { buildCsvFilename, buildPaymentsCsv } from '../../lib/csv';
import { formatCount } from '../../lib/format';
import type { ColumnConfig } from '../../model/columns';
import type { Transaction } from '../../model/transaction';

/**
 * CSV export of the current view (every row matching the filters, in the
 * current sort, all pages) or of the selected rows only. Both use the
 * visible columns in their current order.
 */
export function ExportMenu({
  viewRows,
  selectedRows,
  columns,
}: {
  readonly viewRows: readonly Transaction[];
  readonly selectedRows: readonly Transaction[];
  readonly columns: readonly ColumnConfig[];
}) {
  const [announcement, setAnnouncement] = useState('');

  const exportRows = (rows: readonly Transaction[], scope: 'view' | 'selected') => {
    try {
      downloadTextFile(buildCsvFilename(new Date(), scope), buildPaymentsCsv(rows, columns));
      setAnnouncement(`Exported ${formatCount(rows.length)} payments to CSV.`);
    } catch {
      setAnnouncement('The CSV export failed. Try again.');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Share className="size-3.5" aria-hidden />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Export as CSV</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={viewRows.length === 0}
            onSelect={() => exportRows(viewRows, 'view')}
          >
            <span className="flex-1">Current view</span>
            <span className="text-[12px] text-fg-muted tabular">
              {formatCount(viewRows.length)} rows
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={selectedRows.length === 0}
            onSelect={() => exportRows(selectedRows, 'selected')}
          >
            <span className="flex-1">Selected payments</span>
            <span className="text-[12px] text-fg-muted tabular">
              {formatCount(selectedRows.length)} rows
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
