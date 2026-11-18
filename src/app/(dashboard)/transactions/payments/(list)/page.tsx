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
      <div className="mt-[5px]">
        <TransactionsTabs />
      </div>
      <div className="mt-[22px]">
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
