'use client';

import { ArrowLeft } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';

import { readLastListUrl } from '../../hooks/use-payments-query';
import { PAYMENTS_PATH } from '../../routes';

const noopSubscribe = () => () => {};

/**
 * Back to the list with the filters the user had. The server renders the plain
 * list URL and the stored one replaces it after hydration, so the markup
 * matches.
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
