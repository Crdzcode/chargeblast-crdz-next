'use client';

import { useId, useState, type FormEvent } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { inputStyles } from '@/components/ui/input-styles';
import { cn } from '@/lib/cn';
import { APP_TIME_ZONE_LABEL, parseCalendarDate } from '@/lib/time-zone';

import {
  AMOUNT_OPERATORS,
  amountFormFromBounds,
  amountFormToBounds,
  type AmountForm,
  type AmountOperator,
} from '../../lib/amount-filter';
import { DATE_PRESET_LABELS } from '../../lib/date-range';
import { DATE_PRESETS, type DateFilter, type DatePreset } from '../../model/query';
import { FilterApplyFooter } from './filter-chip';

const inputClass = cn(inputStyles, 'w-full');
const optionRowClass =
  'flex h-8 cursor-pointer items-center gap-2.5 rounded-control px-2 text-[14px] hover:bg-surface';

export interface ChecklistOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** Checked values are only applied on Apply, in the order of `options`. */
export function ChecklistPanel<T extends string>({
  options,
  selected,
  onApply,
  name,
}: {
  readonly options: readonly ChecklistOption<T>[];
  readonly selected: readonly T[];
  readonly onApply: (values: readonly T[]) => void;
  readonly name: string;
}) {
  const [draft, setDraft] = useState<readonly T[]>(selected);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onApply(options.map((option) => option.value).filter((value) => draft.includes(value)));
  };

  return (
    <form onSubmit={submit}>
      <fieldset className="flex flex-col gap-0.5 px-2 py-2">
        <legend className="sr-only">{name}</legend>
        {options.map((option) => {
          const checked = draft.includes(option.value);

          return (
            <label key={option.value} className={optionRowClass}>
              <Checkbox
                checked={checked}
                onCheckedChange={(next) =>
                  setDraft((current) =>
                    next === true
                      ? [...current, option.value]
                      : current.filter((value) => value !== option.value),
                  )
                }
              />
              {option.label}
            </label>
          );
        })}
      </fieldset>
      <FilterApplyFooter />
    </form>
  );
}

type DateChoice = DatePreset | 'custom';

export function DatePanel({
  value,
  onApply,
}: {
  readonly value: DateFilter | null;
  readonly onApply: (value: DateFilter | null) => void;
}) {
  const id = useId();
  const [choice, setChoice] = useState<DateChoice>(value?.preset ?? '7d');
  const [from, setFrom] = useState(value?.preset === 'custom' ? (value.from ?? '') : '');
  const [to, setTo] = useState(value?.preset === 'custom' ? (value.to ?? '') : '');
  const fromDate = parseCalendarDate(from);
  const toDate = parseCalendarDate(to);
  const inverted = fromDate !== null && toDate !== null && from > to;
  const customEmpty = choice === 'custom' && fromDate === null && toDate === null;

  const submit = (event: FormEvent) => {
    event.preventDefault();

    if (choice !== 'custom') {
      onApply({ preset: choice });
    } else if (!inverted && !customEmpty) {
      onApply({ preset: 'custom', from: fromDate ? from : null, to: toDate ? to : null });
    }
  };

  return (
    <form onSubmit={submit}>
      <fieldset className="flex flex-col gap-0.5 px-2 py-2">
        <legend className="sr-only">Date range</legend>
        {[...DATE_PRESETS, 'custom' as const].map((preset) => (
          <label key={preset} className={optionRowClass}>
            <input
              type="radio"
              name={`${id}-preset`}
              value={preset}
              checked={choice === preset}
              onChange={() => setChoice(preset)}
              className="size-4 accent-primary"
            />
            {DATE_PRESET_LABELS[preset]}
          </label>
        ))}
      </fieldset>
      {choice === 'custom' ? (
        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
          <label className="flex flex-col gap-1 text-[12px] font-semibold text-fg-secondary">
            From
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(event) => setFrom(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] font-semibold text-fg-secondary">
            To
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
              className={inputClass}
            />
          </label>
          <p
            className={cn('col-span-2 text-[12px]', inverted ? 'text-danger-fg' : 'text-fg-muted')}
            role={inverted ? 'alert' : undefined}
          >
            {inverted
              ? 'The start date must be on or before the end date.'
              : `Both days are included. Times use the account time zone (${APP_TIME_ZONE_LABEL}).`}
          </p>
        </div>
      ) : null}
      <FilterApplyFooter disabled={choice === 'custom' && (inverted || customEmpty)} />
    </form>
  );
}

export function AmountPanel({
  min,
  max,
  onApply,
}: {
  readonly min: number | null;
  readonly max: number | null;
  readonly onApply: (min: number | null, max: number | null) => void;
}) {
  const [form, setForm] = useState(() => amountFormFromBounds(min, max));
  const [error, setError] = useState<string | null>(null);
  const { operator, first, second } = form;

  const edit = (patch: Partial<AmountForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = amountFormToBounds(form);

    if (result.ok) {
      onApply(result.min, result.max);
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-2 px-4 py-3">
        <select
          aria-label="Amount condition"
          value={operator}
          onChange={(event) => edit({ operator: event.target.value as AmountOperator })}
          className={inputClass}
        >
          {AMOUNT_OPERATORS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            aria-label={operator === 'between' ? 'Minimum amount' : 'Amount'}
            inputMode="decimal"
            placeholder="0.00"
            value={first}
            onChange={(event) => edit({ first: event.target.value })}
            className={inputClass}
          />
          {operator === 'between' ? (
            <>
              <span className="text-fg-muted">and</span>
              <input
                aria-label="Maximum amount"
                inputMode="decimal"
                placeholder="0.00"
                value={second}
                onChange={(event) => edit({ second: event.target.value })}
                className={inputClass}
              />
            </>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="text-[12px] text-danger-fg">
            {error}
          </p>
        ) : (
          <p className="text-[12px] text-fg-muted">
            Amounts compare nominally across currencies (no conversion). Combine with Currency to
            compare a single currency.
          </p>
        )}
      </div>
      <FilterApplyFooter />
    </form>
  );
}

/** Edits the search started from the top bar. */
export function SearchPanel({
  value,
  onApply,
}: {
  readonly value: string;
  readonly onApply: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft.trim());
      }}
    >
      <div className="px-4 py-3">
        <input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Search payments by ID, email or last 4 digits"
          placeholder="Payment ID, email or last 4"
          className={inputClass}
        />
      </div>
      <FilterApplyFooter />
    </form>
  );
}
