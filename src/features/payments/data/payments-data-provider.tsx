'use client';

import { createContext, use, useMemo, type ReactNode } from 'react';

import type { Transaction } from '../model/transaction';
import { getTransactions } from './payments-repository';

interface PaymentsData {
  /** The request time from the server. Use it instead of Date.now() for anything relative. */
  readonly referenceNow: number;
  readonly transactions: readonly Transaction[];
}

const PaymentsDataContext = createContext<PaymentsData | null>(null);

/**
 * Gives client components the day's data. Only the timestamp comes from the
 * server; the browser rebuilds the same data from it, which keeps the payload
 * small and hydration matching.
 */
export function PaymentsDataProvider({
  referenceNow,
  children,
}: {
  readonly referenceNow: number;
  readonly children: ReactNode;
}) {
  const value = useMemo(
    () => ({ referenceNow, transactions: getTransactions(referenceNow) }),
    [referenceNow],
  );

  return <PaymentsDataContext value={value}>{children}</PaymentsDataContext>;
}

export function usePaymentsData(): PaymentsData {
  const value = use(PaymentsDataContext);

  if (value === null) {
    throw new Error('usePaymentsData must be used inside <PaymentsDataProvider>.');
  }

  return value;
}
