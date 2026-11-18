/*
 * The amount filter is stored as inclusive bounds in minor units (cents).
 * The panel offers Stripe's wording instead, so "greater than 10.00" becomes
 * min 10.01 and "less than 10.00" becomes max 9.99.
 */

export type AmountOperator = 'between' | 'equal' | 'greater' | 'less';

export const AMOUNT_OPERATORS: readonly { value: AmountOperator; label: string }[] = [
  { value: 'between', label: 'is between' },
  { value: 'equal', label: 'is equal to' },
  { value: 'greater', label: 'is greater than' },
  { value: 'less', label: 'is less than' },
];

export interface AmountForm {
  readonly operator: AmountOperator;
  readonly first: string;
  readonly second: string;
}

export type AmountFormResult =
  | { readonly ok: true; readonly min: number | null; readonly max: number | null }
  | { readonly ok: false; readonly error: string };

/** "21.98" or "21,98" becomes 2198. Anything else is null. */
export function parseAmountInput(value: string): number | null {
  const trimmed = value.trim();

  if (!/^\d+([.,]\d{0,2})?$/.test(trimmed)) {
    return null;
  }

  return Math.round(Number(trimmed.replace(',', '.')) * 100);
}

function formatAmountInput(minor: number | null): string {
  return minor === null ? '' : (minor / 100).toFixed(2);
}

/** What the panel shows for the bounds that are currently applied. */
export function amountFormFromBounds(min: number | null, max: number | null): AmountForm {
  if (min !== null && max !== null) {
    return {
      operator: min === max ? 'equal' : 'between',
      first: formatAmountInput(min),
      second: formatAmountInput(max),
    };
  }

  if (min !== null) {
    return { operator: 'greater', first: formatAmountInput(min - 1), second: '' };
  }

  if (max !== null) {
    return { operator: 'less', first: formatAmountInput(max + 1), second: formatAmountInput(max) };
  }

  return { operator: 'between', first: '', second: '' };
}

export function amountFormToBounds({ operator, first, second }: AmountForm): AmountFormResult {
  const a = parseAmountInput(first);
  const b = parseAmountInput(second);

  if (a === null || (operator === 'between' && b === null)) {
    return { ok: false, error: 'Enter a valid amount, e.g. 19.99.' };
  }

  switch (operator) {
    case 'between':
      if (b !== null && a > b) {
        return { ok: false, error: 'The minimum must not be greater than the maximum.' };
      }
      return { ok: true, min: a, max: b };
    case 'equal':
      return { ok: true, min: a, max: a };
    case 'greater':
      return { ok: true, min: a + 1, max: null };
    case 'less':
      return { ok: true, min: null, max: Math.max(a - 1, 0) };
  }
}
