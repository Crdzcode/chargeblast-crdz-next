import type { Metadata } from 'next';
import { Suspense } from 'react';

import {
  AnnouncementBanner,
  PaymentsPageHeader,
  TransactionsTabs,
} from '@/features/payments/components/page-chrome';
import { PaymentsWorkspace } from '@/features/payments/components/payments-workspace';
import { TableSkeleton } from '@/features/payments/components/states';

export const metadata: Metadata = {
  title: 'Payments',
};

export default function PaymentsPage() {
  return (
    <>
      <PaymentsPageHeader />
      <div className="mt-0.5">
        <TransactionsTabs />
      </div>
      <div className="mt-6">
        <AnnouncementBanner />
      </div>
      <div className="mt-4">
        <Suspense fallback={<TableSkeleton />}>
          <PaymentsWorkspace />
        </Suspense>
      </div>
    </>
  );
}
