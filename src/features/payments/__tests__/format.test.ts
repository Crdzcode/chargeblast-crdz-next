import { describe, expect, it } from 'vitest';

import {
  formatAmount,
  formatFullDateTime,
  formatRelativeTime,
  formatShortDateTime,
} from '../lib/format';
import { describePaymentMethod, shortenPaymentId } from '../lib/presentation';
import { makeTransaction } from './fixtures';

describe('formatting', () => {
  it('formats amounts with their currency symbol', () => {
    expect(formatAmount(2198, 'USD')).toBe('$21.98');
    expect(formatAmount(9999, 'BRL')).toBe('R$ 99.99');
    expect(formatAmount(1999, 'EUR')).toBe('€19.99');
    expect(formatAmount(1599, 'GBP')).toBe('£15.99');
    expect(formatAmount(1234567, 'USD')).toBe('$12,345.67');
  });

  it('formats dates in the account time zone, not the process zone', () => {
    // The test process runs in Asia/Tokyo (see vitest.config.mts).
    expect(formatShortDateTime('2026-08-16T20:03:00.000Z')).toBe('Aug 16, 5:03 PM');
    expect(formatFullDateTime('2026-08-16T20:03:09.000Z')).toBe('Aug 16, 2026, 5:03:09 PM GMT-3');
    expect(formatShortDateTime('not-a-date')).toBe('—');
  });

  it('formats relative time against an injected clock', () => {
    const now = Date.parse('2026-11-18T15:00:00.000Z');

    expect(formatRelativeTime('2026-11-18T14:59:30.000Z', now)).toBe('just now');
    expect(formatRelativeTime('2026-11-18T12:00:00.000Z', now)).toBe('3 hours ago');
    expect(formatRelativeTime('2026-11-17T15:00:00.000Z', now)).toBe('yesterday');
    expect(formatRelativeTime('2026-11-04T15:00:00.000Z', now)).toBe('2 weeks ago');
  });

  it('abbreviates payment ids but keeps short ids intact', () => {
    expect(shortenPaymentId('pi_3QxYz8LkdIwHu7ix0bA1cD2E')).toBe('pi_3QxYz…cD2E');
    expect(shortenPaymentId('pi_short')).toBe('pi_short');
  });

  it('describes every payment method kind', () => {
    expect(describePaymentMethod(makeTransaction().paymentMethod)).toBe('Visa ending in 4242');
    expect(
      describePaymentMethod({ type: 'wallet', wallet: 'link', brand: 'mastercard', last4: '0900' }),
    ).toBe('Link with Mastercard ending in 0900');
    expect(
      describePaymentMethod({
        type: 'ach',
        bankName: 'Chase',
        last4: '1821',
        accountType: 'savings',
      }),
    ).toBe('Chase savings (ACH) ending in 1821');
  });
});
