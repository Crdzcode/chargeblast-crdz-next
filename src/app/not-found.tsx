import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { PAYMENTS_PATH } from '@/features/payments/routes';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-[13px] font-semibold text-primary-text">404</p>
      <h1 className="text-[24px] font-bold">Page not found</h1>
      <p className="max-w-sm text-fg-secondary">
        This demo only includes the Payments area of the dashboard.
      </p>
      <Button asChild variant="primary" className="mt-2">
        <Link href={PAYMENTS_PATH}>Go to Payments</Link>
      </Button>
    </main>
  );
}
