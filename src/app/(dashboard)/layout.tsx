import type { ReactNode } from 'react';

import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { PaymentsDataProvider } from '@/features/payments/data/payments-data-provider';
import { getReferenceTime } from '@/features/payments/data/reference-time';

/**
 * Reads the clock once per request and passes it down, so every client
 * component builds the same data.
 */
export default async function DashboardLayout({ children }: { readonly children: ReactNode }) {
  const referenceNow = await getReferenceTime();

  return (
    <PaymentsDataProvider referenceNow={referenceNow}>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main id="main" className="min-w-0 flex-1 px-4 pt-[19px] pb-10 md:px-10">
            {children}
          </main>
        </div>
      </div>
    </PaymentsDataProvider>
  );
}
