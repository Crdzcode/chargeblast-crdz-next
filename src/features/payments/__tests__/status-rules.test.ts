import { describe, expect, it } from 'vitest';

import { matchesStatusView } from '../model/query';
import { PAYMENT_STATUSES, isSelectablePayment } from '../model/transaction';
import { makeTransaction } from './fixtures';

describe('status rules', () => {
  it('counts blocked payments in the Failed view', () => {
    expect(matchesStatusView(makeTransaction({ status: 'blocked' }), 'failed')).toBe(true);
    expect(matchesStatusView(makeTransaction({ status: 'canceled' }), 'failed')).toBe(false);
  });

  it('only lets payments that moved money be selected', () => {
    const selectable = PAYMENT_STATUSES.filter((status) =>
      isSelectablePayment(makeTransaction({ status })),
    );

    expect(selectable).toEqual(['succeeded', 'pending', 'refunded']);
  });
});
