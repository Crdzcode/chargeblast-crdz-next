import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/features/payments/components/states';

export default function PaymentsLoading() {
  return (
    <div aria-label="Loading payments">
      <Skeleton className="mt-2 h-8 w-48" />
      <Skeleton className="mt-6 h-6 w-[420px] max-w-full" />
      <Skeleton className="mt-6 h-9 w-full" />
      <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-11" />
        ))}
      </div>
      <Skeleton className="mt-4 mb-3 h-[26px] w-[520px] max-w-full" />
      <TableSkeleton />
    </div>
  );
}
