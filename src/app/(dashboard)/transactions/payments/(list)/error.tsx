'use client';

import { useEffect } from 'react';

import { ErrorState } from '@/features/payments/components/states';

export default function PaymentsError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="pt-6">
      <h1 className="mb-6 text-[28px] leading-9 font-bold">Transactions</h1>
      <ErrorState onRetry={reset} />
    </div>
  );
}
