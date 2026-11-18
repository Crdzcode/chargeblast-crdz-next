'use client';

import { ArrowLeft } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { PAYMENTS_PATH, readLastListUrl } from '../../hooks/use-payments-query';

const noopSubscribe = () => () => {};

/**
 * Link back to the Payments list, restoring the filters the user came from.
 * The server renders the plain list URL; the stored URL is applied after
 * hydration, so markup never mismatches.
 */
export function BackToPayments() {
  const href = useSyncExternalStore(noopSubscribe, readLastListUrl, () => PAYMENTS_PATH);

  return (
    <Link
      href={href as Route}
      className="inline-flex items-center gap-1.5 rounded-sm text-[14px] font-semibold text-primary-text hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Payments
    </Link>
  );
}
