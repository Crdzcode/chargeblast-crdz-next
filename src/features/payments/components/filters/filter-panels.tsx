'use client';

import { useId, useState, type FormEvent } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/cn';
import { parseCalendarDate } from '@/lib/time-zone';

import { DATE_PRESET_LABELS } from '../../lib/date-range';
import { DATE_PRESETS, type DateFilter, type DatePreset } from '../../model/query';
import { FilterApplyFooter } from './filter-chip';

const inputClass =
  'h-7 w-full rounded-control border border-line-strong bg-canvas px-2 text-[14px] text-fg shadow-control placeholder:text-fg-disabled focus-visible:border-primary';

export interface ChecklistOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** Multi-select checklist staged until Apply; keeps the option order. */
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
            <label
              key={option.value}
              className="flex h-8 cursor-pointer items-center gap-2.5 rounded-control px-2 text-[14px] hover:bg-surface"
            >
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

/** Presets (Today, 7 days, 30 days) or an inclusive custom range. */
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
          <label
            key={preset}
            className="flex h-8 cursor-pointer items-center gap-2.5 rounded-control px-2 text-[14px] hover:bg-surface"
          >
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
              : 'Both days are included. Times use the account time zone (GMT-3).'}
          </p>
        </div>
      ) : null}
      <FilterApplyFooter disabled={choice === 'custom' && (inverted || customEmpty)} />
    </form>
  );
}

export type AmountOperator = 'between' | 'equal' | 'greater' | 'less';

const AMOUNT_OPERATORS: readonly { value: AmountOperator; label: string }[] = [
  { value: 'between', label: 'is between' },
  { value: 'equal', label: 'is equal to' },
  { value: 'greater', label: 'is greater than' },
  { value: 'less', label: 'is less than' },
];

/** Parses a major-unit input ("21.98" or "21,98") into integer cents. */
export function parseAmountInput(value: string): number | null {
  const trimmed = value.trim();

  if (!/^\d+([.,]\d{0,2})?$/.test(trimmed)) {
    return null;
  }

  return Math.round(Number(trimmed.replace(',', '.')) * 100);
}

function toInput(minor: number | null): string {
  return minor === null ? '' : (minor / 100).toFixed(2);
}

function initialOperator(min: number | null, max: number | null): AmountOperator {
  if (min !== null && max !== null) return min === max ? 'equal' : 'between';
  if (max !== null) return 'less';
  if (min !== null) return 'greater';
  return 'between';
}

/** Amount range with Stripe's operators; bounds are inclusive minor units. */
export function AmountPanel({
  min,
  max,
  onApply,
}: {
  readonly min: number | null;
  readonly max: number | null;
  readonly onApply: (min: number | null, max: number | null) => void;
}) {
  const [operator, setOperator] = useState<AmountOperator>(() => initialOperator(min, max));
  // "Greater/less than" are stored as inclusive bounds one cent inside the value.
  const [first, setFirst] = useState(() => {
    switch (initialOperator(min, max)) {
      case 'greater':
        return toInput(min === null ? null : min - 1);
      case 'less':
        return toInput(max === null ? null : max + 1);
      default:
        return toInput(min);
    }
  });
  const [second, setSecond] = useState(toInput(max));
  const [error, setError] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const a = parseAmountInput(first);
    const b = parseAmountInput(second);

    if (a === null || (operator === 'between' && b === null)) {
      setError('Enter a valid amount, e.g. 19.99.');
      return;
    }

    switch (operator) {
      case 'between':
        if (b !== null && a > b) {
          setError('The minimum must not be greater than the maximum.');
          return;
        }
        onApply(a, b);
        break;
      case 'equal':
        onApply(a, a);
        break;
      case 'greater':
        // "Greater than" is exclusive in wording; one cent above keeps bounds inclusive.
        onApply(a + 1, null);
        break;
      case 'less':
        onApply(null, Math.max(a - 1, 0));
        break;
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex flex-col gap-2 px-4 py-3">
        <select
          aria-label="Amount condition"
          value={operator}
          onChange={(event) => {
            setOperator(event.target.value as AmountOperator);
            setError(null);
          }}
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
            onChange={(event) => {
              setFirst(event.target.value);
              setError(null);
            }}
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
                onChange={(event) => {
                  setSecond(event.target.value);
                  setError(null);
                }}
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
