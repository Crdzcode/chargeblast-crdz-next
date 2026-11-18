'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

import { usePaymentsData } from '../data/payments-data-provider';
import { useColumnPreferences } from '../hooks/use-column-preferences';
import { usePaymentsQuery } from '../hooks/use-payments-query';
import { formatCount } from '../lib/format';
import { runPaymentsQuery } from '../lib/pipeline';
import { visibleColumns } from '../model/columns';
import { clearFilters, hasActiveFilters } from '../model/query';
import { isSelectablePayment } from '../model/transaction';
import { paymentHref } from '../routes';
import { MobilePaymentList } from './mobile-payment-list';
import { PaginationBar } from './pagination-bar';
import { PaymentsTable } from './payments-table';
import { EmptyState } from './states';
import { StatusViewCards } from './status-view-cards';
import { EditColumns } from './toolbar/edit-columns';
import { ExportMenu } from './toolbar/export-menu';
import { FilterBar } from './toolbar/filter-bar';
import { SavedFiltersMenu } from './toolbar/saved-filters-menu';

/**
 * The interactive part of the Payments page. Where state lives:
 * - filters, search, sort and page: the URL;
 * - column preferences and saved filters: localStorage;
 * - row selection: this component.
 * What's on screen comes from runPaymentsQuery.
 */
export function PaymentsWorkspace() {
  const router = useRouter();
  const { referenceNow, transactions } = usePaymentsData();
  const { query, setQuery, updateFilters } = usePaymentsQuery();
  const { columns, saveColumns, resetColumns } = useColumnPreferences();
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());

  const result = useMemo(
    () => runPaymentsQuery(transactions, query, { now: referenceNow }),
    [transactions, query, referenceNow],
  );
  const { pagination } = result;
  const filtered = hasActiveFilters(query);
  const shownColumns = useMemo(() => visibleColumns(columns), [columns]);
  const selectedRows = useMemo(
    () => result.rows.filter((row) => selectedIds.has(row.id)),
    [result.rows, selectedIds],
  );

  // A shared link can point past the last page. Fix the URL instead of showing
  // nothing.
  useEffect(() => {
    if (pagination.totalPages > 0 && query.page !== pagination.page) {
      setQuery({ ...query, page: pagination.page }, 'replace');
    }
  }, [pagination.page, pagination.totalPages, query, setQuery]);

  const toggleRow = (id: string, selected: boolean) =>
    setSelectedIds((current) => {
      const next = new Set(current);

      if (selected) next.add(id);
      else next.delete(id);

      return next;
    });

  const togglePage = (selected: boolean) =>
    setSelectedIds((current) => {
      const next = new Set(current);

      for (const row of result.pageRows.filter(isSelectablePayment)) {
        if (selected) next.add(row.id);
        else next.delete(row.id);
      }

      return next;
    });

  return (
    <div className="flex flex-col">
      <StatusViewCards value={query.view} onChange={(view) => updateFilters({ view })} />

      <div className="mt-4 mb-3 flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <FilterBar query={query} onChange={(patch) => updateFilters(patch)} />
        {filtered ? (
          <button
            type="button"
            onClick={() => setQuery(clearFilters(query))}
            className="text-[13px] font-semibold text-primary-text hover:underline"
          >
            Clear filters
          </button>
        ) : null}
        <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
          <SavedFiltersMenu query={query} onApply={(saved) => setQuery(saved)} />
          <ExportMenu viewRows={result.rows} selectedRows={selectedRows} columns={shownColumns} />
          <EditColumns columns={columns} onChange={saveColumns} onReset={resetColumns} />
        </div>
      </div>

      {result.rows.length === 0 ? (
        <EmptyState filtered={filtered} onClearFilters={() => setQuery(clearFilters(query))} />
      ) : (
        <>
          <div className="hidden md:block">
            <PaymentsTable
              rows={result.pageRows}
              columns={columns}
              sortBy={query.sortBy}
              sortDirection={query.sortDirection}
              selectedIds={selectedIds}
              onSortChange={(sortBy, sortDirection) =>
                setQuery({ ...query, sortBy, sortDirection, page: 1 })
              }
              onToggleRow={toggleRow}
              onTogglePage={togglePage}
              onColumnsChange={saveColumns}
              onOpenPayment={(id) => router.push(paymentHref(id))}
            />
          </div>
          <div className="md:hidden">
            <MobilePaymentList
              rows={result.pageRows}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
            />
          </div>
        </>
      )}

      <PaginationBar
        pagination={pagination}
        onPageChange={(page) => {
          setQuery({ ...query, page });
          window.scrollTo({ top: 0 });
        }}
        onPageSizeChange={(pageSize) => setQuery({ ...query, pageSize, page: 1 })}
        selection={
          selectedIds.size > 0 ? (
            <span className="inline-flex items-center gap-2 text-[13px] text-fg-secondary">
              <span className="tabular">
                <span className="font-semibold text-fg">{formatCount(selectedIds.size)}</span>{' '}
                selected
                {selectedRows.length !== selectedIds.size
                  ? ` (${formatCount(selectedRows.length)} in this view)`
                  : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1 text-[13px]"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear selection
              </Button>
            </span>
          ) : null
        }
      />
    </div>
  );
}
