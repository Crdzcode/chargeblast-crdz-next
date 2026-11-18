'use client';

import { useEffect } from 'react';

import { BackToPayments } from '@/features/payments/components/details/back-to-payments';
import { ErrorState } from '@/features/payments/components/states';

export default function PaymentError({
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
    <div className="flex flex-col gap-6 pt-3">
      <BackToPayments />
      <ErrorState
        onRetry={reset}
        title="This payment could not be loaded"
        message="Something went wrong while loading the payment details."
      />
    </div>
  );
}
