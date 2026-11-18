import { describe, expect, it } from 'vitest';

import { DAY_MS } from '@/lib/time-zone';

import { generateTransactions } from '../data/generate-transactions';
import { resolveDateFilter } from '../lib/date-range';
import {
  CARD_BRANDS,
  CURRENCIES,
  PAYMENT_METHOD_TYPES,
  PAYMENT_STATUSES,
  WALLET_PROVIDERS,
  type Transaction,
} from '../model/transaction';

const NOON = Date.parse('2026-11-18T15:00:00.000Z'); // 12:00 in São Paulo
const JUST_AFTER_MIDNIGHT = Date.parse('2026-11-18T03:05:00.000Z'); // 00:05 in São Paulo
const LATE_NIGHT = Date.parse('2026-11-19T02:59:00.000Z'); // 23:59 in São Paulo

const dataset = generateTransactions(NOON);

function countIn(
  transactions: readonly Transaction[],
  preset: 'today' | '7d' | '30d',
  now: number,
) {
  const range = resolveDateFilter({ preset }, now);

  return transactions.filter((transaction) => {
    const createdAt = Date.parse(transaction.createdAt);

    return range !== null && createdAt >= (range.from ?? 0) && createdAt <= (range.to ?? Infinity);
  }).length;
}

describe('generateTransactions', () => {
  it('is deterministic for the same reference instant', () => {
    expect(generateTransactions(NOON)).toEqual(dataset);
  });

  it('produces roughly 1,000 rows with unique Stripe-style ids', () => {
    expect(dataset.length).toBeGreaterThanOrEqual(900);
    expect(dataset.length).toBeLessThanOrEqual(1000);
    expect(new Set(dataset.map((transaction) => transaction.id)).size).toBe(dataset.length);

    for (const transaction of dataset) {
      expect(transaction.id).toMatch(/^pi_3[0-9A-Za-z]{24}$/);
      expect(transaction.customer.id).toMatch(/^cus_[0-9A-Za-z]{14}$/);
    }
  });

  it('never creates payments in the future and sorts newest first', () => {
    for (const now of [JUST_AFTER_MIDNIGHT, NOON, LATE_NIGHT]) {
      const transactions = generateTransactions(now);

      transactions.forEach((transaction, index) => {
        expect(Date.parse(transaction.createdAt)).toBeLessThanOrEqual(now);

        const previous = transactions[index - 1];

        if (previous) {
          expect(Date.parse(previous.createdAt)).toBeGreaterThanOrEqual(
            Date.parse(transaction.createdAt),
          );
        }
      });
    }
  });

  it('always has rows for Today, 7 days and 30 days, even right after midnight', () => {
    for (const now of [JUST_AFTER_MIDNIGHT, NOON, LATE_NIGHT]) {
      const transactions = generateTransactions(now);

      expect(countIn(transactions, 'today', now)).toBeGreaterThanOrEqual(3);
      expect(countIn(transactions, '7d', now)).toBeGreaterThan(150);
      expect(countIn(transactions, '30d', now)).toBeGreaterThan(400);
      expect(transactions.length - countIn(transactions, '30d', now)).toBeGreaterThan(300);
    }

    expect(countIn(generateTransactions(LATE_NIGHT), 'today', LATE_NIGHT)).toBeGreaterThan(40);
  });

  it('keeps a payment stable during the day and shifts it by whole days', () => {
    const later = generateTransactions(NOON + 3 * 60 * 60 * 1000);
    const nextDay = generateTransactions(NOON + DAY_MS);
    const byId = (transactions: readonly Transaction[]) =>
      new Map(transactions.map((transaction) => [transaction.id, transaction]));
    const laterById = byId(later);
    const nextDayById = byId(nextDay);
    const olderThanToday = dataset.filter(
      (transaction) => Date.parse(transaction.createdAt) < Date.parse('2026-11-18T03:00:00.000Z'),
    );

    for (const transaction of olderThanToday) {
      expect(laterById.get(transaction.id)).toEqual(transaction);
      expect(Date.parse(nextDayById.get(transaction.id)?.createdAt ?? '')).toBe(
        Date.parse(transaction.createdAt) + DAY_MS,
      );
    }
  });

  it('covers every status, currency, method type, brand and wallet', () => {
    const values = <T>(pick: (transaction: Transaction) => T | null) =>
      new Set(dataset.map(pick).filter((value): value is T => value !== null));

    expect(values((transaction) => transaction.status)).toEqual(new Set(PAYMENT_STATUSES));
    expect(values((transaction) => transaction.currency)).toEqual(new Set(CURRENCIES));
    expect(values((transaction) => transaction.paymentMethod.type)).toEqual(
      new Set(PAYMENT_METHOD_TYPES),
    );
    expect(
      values((transaction) =>
        transaction.paymentMethod.type === 'ach' ? null : transaction.paymentMethod.brand,
      ),
    ).toEqual(new Set(CARD_BRANDS));
    expect(
      values((transaction) =>
        transaction.paymentMethod.type === 'wallet' ? transaction.paymentMethod.wallet : null,
      ),
    ).toEqual(new Set(WALLET_PROVIDERS));
  });

  it('keeps refund, decline, dispute and capture data coherent', () => {
    for (const transaction of dataset) {
      const createdAt = Date.parse(transaction.createdAt);

      if (transaction.status === 'refunded') {
        expect(transaction.refundedAt).not.toBeNull();
        expect(Date.parse(transaction.refundedAt ?? '')).toBeGreaterThan(createdAt);
        expect(Date.parse(transaction.refundedAt ?? '')).toBeLessThanOrEqual(NOON);
      } else {
        expect(transaction.refundedAt).toBeNull();
      }

      expect(transaction.declineReason !== null).toBe(transaction.status === 'failed');

      if (transaction.disputedAt !== null) {
        expect(transaction.status).toBe('succeeded');
        expect(Date.parse(transaction.disputedAt)).toBeGreaterThan(createdAt);
        expect(Date.parse(transaction.disputedAt)).toBeLessThanOrEqual(NOON);
      }

      if (!transaction.captured) {
        expect(transaction.status).toBe('pending');
        expect(transaction.paymentMethod.type).not.toBe('ach');
      }
    }

    expect(dataset.some((transaction) => transaction.disputedAt !== null)).toBe(true);
    expect(dataset.some((transaction) => !transaction.captured)).toBe(true);
  });

  it('uses realistic amounts, 4-digit last4, ACH only in USD and reserved email domains', () => {
    for (const transaction of dataset) {
      expect(Number.isInteger(transaction.amountMinor)).toBe(true);
      expect(transaction.amountMinor).toBeGreaterThan(0);
      expect(transaction.paymentMethod.last4).toMatch(/^\d{4}$/);
      expect(transaction.customer.email).toMatch(/^[a-z0-9._]+@example\.(com|org|net)$/);

      if (transaction.paymentMethod.type === 'ach') {
        expect(transaction.currency).toBe('USD');
      }
    }
  });
});
