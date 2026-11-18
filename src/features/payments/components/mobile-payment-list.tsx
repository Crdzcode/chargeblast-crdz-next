'use client';

import Link from 'next/link';

import { Checkbox } from '@/components/ui/checkbox';

import { formatShortDateTime } from '../lib/format';
import { shortenPaymentId } from '../lib/presentation';
import { isSelectablePayment, type Transaction } from '../model/transaction';
import { paymentHref } from '../routes';
import { AmountCell, PaymentMethodCell, StatusBadge } from './cells';

/**
 * Replaces the table on narrow screens: the required columns stacked in a card,
 * with selection and a link to the payment.
 */
export function MobilePaymentList({
  rows,
  selectedIds,
  onToggleRow,
}: {
  readonly rows: readonly Transaction[];
  readonly selectedIds: ReadonlySet<string>;
  readonly onToggleRow: (id: string, selected: boolean) => void;
}) {
  return (
    <ul className="border-t border-line-strong" aria-label="Payments">
      {rows.map((row) => (
        <li key={row.id} className="flex gap-3 border-b border-line py-3">
          <Checkbox
            className="mt-0.5"
            aria-label={`Select payment ${row.id}`}
            checked={selectedIds.has(row.id)}
            disabled={!isSelectablePayment(row)}
            onCheckedChange={(checked) => onToggleRow(row.id, checked === true)}
          />
          <Link href={paymentHref(row.id)} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2">
              <AmountCell amountMinor={row.amountMinor} currency={row.currency} />
              <StatusBadge status={row.status} />
            </span>
            <span className="truncate text-fg">{row.customer.email}</span>
            <span className="flex items-center justify-between gap-2 text-[13px] text-fg-secondary">
              <PaymentMethodCell method={row.paymentMethod} />
              <time dateTime={row.createdAt}>{formatShortDateTime(row.createdAt)}</time>
            </span>
            <span className="text-[12px] text-fg-muted tabular">{shortenPaymentId(row.id)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
