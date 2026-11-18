import type { Transaction } from '../model/transaction';
import { generateTransactions } from './generate-transactions';

/**
 * In-memory data access for the mock dataset. Kept behind small functions
 * so a real API could replace it without touching the UI.
 *
 * The dataset is a pure function of the reference instant, so results are
 * memoized per instant (server requests and client renders reuse them).
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
