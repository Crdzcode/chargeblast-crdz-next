import { cn } from '@/lib/cn';

export function Skeleton({ className }: { readonly className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('block animate-pulse rounded-[4px] bg-surface-pressed', className)}
    />
  );
}
