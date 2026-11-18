import type { Transaction } from '../model/transaction';
import { generateTransactions } from './generate-transactions';

/**
 * Data access for the mock payments. A real API could replace these two
 * functions without the UI noticing. The data only depends on `now`, so the
 * last result is cached.
 */
let lastSnapshot: { readonly now: number; readonly transactions: readonly Transaction[] } | null =
  null;

export function getTransactions(now: number): readonly Transaction[] {
  if (lastSnapshot?.now !== now) {
    lastSnapshot = { now, transactions: generateTransactions(now) };
  }

  return lastSnapshot.transactions;
}

export function findTransactionById(id: string, now: number): Transaction | null {
  return getTransactions(now).find((transaction) => transaction.id === id) ?? null;
}
