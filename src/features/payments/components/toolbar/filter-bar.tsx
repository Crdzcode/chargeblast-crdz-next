'use client';

import { summarizeAmount, summarizeDate, summarizeList } from '../../lib/filter-summaries';
import {
  CARD_BRAND_LABELS,
  PAYMENT_METHOD_TYPE_LABELS,
  STATUS_LABELS,
} from '../../lib/presentation';
import type { PaymentsQuery } from '../../model/query';
import {
  CARD_BRANDS,
  CURRENCIES,
  PAYMENT_METHOD_TYPES,
  PAYMENT_STATUSES,
  type Currency,
} from '../../model/transaction';
import { FilterChip } from '../filters/filter-chip';
import { AmountPanel, ChecklistPanel, DatePanel } from '../filters/filter-panels';

const CURRENCY_CODES = Object.fromEntries(CURRENCIES.map((code) => [code, code])) as Record<
  Currency,
  string
>;

const toOptions = <T extends string>(values: readonly T[], labels: Readonly<Record<T, string>>) =>
  values.map((value) => ({ value, label: labels[value] }));

const STATUS_OPTIONS = toOptions(PAYMENT_STATUSES, STATUS_LABELS);
const METHOD_OPTIONS = toOptions(PAYMENT_METHOD_TYPES, PAYMENT_METHOD_TYPE_LABELS);
const CURRENCY_OPTIONS = toOptions(CURRENCIES, CURRENCY_CODES);
const BRAND_OPTIONS = toOptions(CARD_BRANDS, CARD_BRAND_LABELS);

/** The chip row in the reference order: Date and time, Amount, Currency, Status, Payment method, More filters. */
export function FilterBar({
  query,
  onChange,
}: {
  readonly query: PaymentsQuery;
  readonly onChange: (patch: Partial<PaymentsQuery>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
      <FilterChip
        label="Date and time"
        summary={summarizeDate(query.date)}
        onClear={() => onChange({ date: null })}
      >
        {(close) => (
          <DatePanel
            value={query.date}
            onApply={(date) => {
              onChange({ date });
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label="Amount"
        summary={summarizeAmount(query.amountMinMinor, query.amountMaxMinor, query.currencies)}
        onClear={() => onChange({ amountMinMinor: null, amountMaxMinor: null })}
      >
        {(close) => (
          <AmountPanel
            min={query.amountMinMinor}
            max={query.amountMaxMinor}
            onApply={(amountMinMinor, amountMaxMinor) => {
              onChange({ amountMinMinor, amountMaxMinor });
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label="Currency"
        summary={summarizeList(query.currencies, CURRENCY_CODES)}
        onClear={() => onChange({ currencies: [] })}
      >
        {(close) => (
          <ChecklistPanel
            name="Currency"
            options={CURRENCY_OPTIONS}
            selected={query.currencies}
            onApply={(currencies) => {
              onChange({ currencies });
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label="Status"
        summary={summarizeList(query.statuses, STATUS_LABELS)}
        onClear={() => onChange({ statuses: [] })}
      >
        {(close) => (
          <ChecklistPanel
            name="Status"
            options={STATUS_OPTIONS}
            selected={query.statuses}
            onApply={(statuses) => {
              onChange({ statuses });
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label="Payment method"
        summary={summarizeList(query.methods, PAYMENT_METHOD_TYPE_LABELS)}
        onClear={() => onChange({ methods: [] })}
      >
        {(close) => (
          <ChecklistPanel
            name="Payment method"
            options={METHOD_OPTIONS}
            selected={query.methods}
            onApply={(methods) => {
              onChange({ methods });
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label="More filters"
        panelTitle="Filter by Card brand"
        summary={summarizeList(query.brands, CARD_BRAND_LABELS)}
        onClear={() => onChange({ brands: [] })}
      >
        {(close) => (
          <ChecklistPanel
            name="Card brand"
            options={BRAND_OPTIONS}
            selected={query.brands}
            onApply={(brands) => {
              onChange({ brands });
              close();
            }}
          />
        )}
      </FilterChip>
    </div>
  );
}
