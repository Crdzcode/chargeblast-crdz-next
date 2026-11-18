import { SearchX } from 'lucide-react';

import { BackToPayments } from '@/features/payments/components/details/back-to-payments';

export default function PaymentNotFound() {
  return (
    <div className="flex flex-col gap-6 pt-3">
      <BackToPayments />
      <div className="flex flex-col items-center gap-2 border-y border-line py-16 text-center">
        <SearchX className="mb-1 size-6 text-fg-muted" aria-hidden />
        <h1 className="text-[18px] font-semibold">Payment not found</h1>
        <p className="max-w-sm text-[14px] text-fg-secondary">
          No payment matches this ID. It may have been typed incorrectly or belong to another
          account.
        </p>
      </div>
    </div>
  );
}
