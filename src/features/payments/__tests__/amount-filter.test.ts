import { describe, expect, it } from 'vitest';

import { amountFormFromBounds, amountFormToBounds, parseAmountInput } from '../lib/amount-filter';

describe('amount filter', () => {
  it('parses amounts with a dot or a comma', () => {
    expect(parseAmountInput('21.98')).toBe(2198);
    expect(parseAmountInput(' 21,9 ')).toBe(2190);
    expect(parseAmountInput('7')).toBe(700);
    expect(parseAmountInput('1.999')).toBeNull();
    expect(parseAmountInput('-5')).toBeNull();
    expect(parseAmountInput('')).toBeNull();
  });

  it('stores "greater than" and "less than" as inclusive bounds one cent inside', () => {
    expect(amountFormToBounds({ operator: 'greater', first: '10', second: '' })).toEqual({
      ok: true,
      min: 1001,
      max: null,
    });
    expect(amountFormToBounds({ operator: 'less', first: '10', second: '' })).toEqual({
      ok: true,
      min: null,
      max: 999,
    });
    expect(amountFormToBounds({ operator: 'equal', first: '5.50', second: '' })).toEqual({
      ok: true,
      min: 550,
      max: 550,
    });
  });

  it('rejects invalid or inverted ranges', () => {
    expect(amountFormToBounds({ operator: 'between', first: '10', second: '' }).ok).toBe(false);
    expect(amountFormToBounds({ operator: 'between', first: '20', second: '10' })).toEqual({
      ok: false,
      error: 'The minimum must not be greater than the maximum.',
    });
  });

  it('shows applied bounds back in the wording they were entered with', () => {
    expect(amountFormFromBounds(1001, null)).toMatchObject({ operator: 'greater', first: '10.00' });
    expect(amountFormFromBounds(null, 999)).toMatchObject({ operator: 'less', first: '10.00' });
    expect(amountFormFromBounds(550, 550)).toMatchObject({ operator: 'equal', first: '5.50' });
    expect(amountFormFromBounds(100, 900)).toEqual({
      operator: 'between',
      first: '1.00',
      second: '9.00',
    });
    expect(amountFormFromBounds(null, null).operator).toBe('between');
  });
});
