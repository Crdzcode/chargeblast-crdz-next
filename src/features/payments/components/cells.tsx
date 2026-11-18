'use client';

import { Check, CircleMinus, Clock3, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';

import { CopyButton } from '@/components/ui/copy-button';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

import {
  formatAmount,
  formatFullDateTime,
  formatRelativeTime,
  formatShortDateTime,
} from '../lib/format';
import { STATUS_LABELS, describePaymentMethod, shortenPaymentId } from '../lib/presentation';
import type { Currency, PaymentMethod, PaymentStatus } from '../model/transaction';
import { PaymentMethodIcons } from './brand-icons';

const SUCCESS = 'border-success-line bg-success-bg text-success-fg';
const WARNING = 'border-warning-line bg-warning-bg text-warning-fg';
const DANGER = 'border-danger-line bg-danger-bg text-danger-fg';
const NEUTRAL = 'border-neutral-line bg-neutral-bg text-neutral-fg';

/** `bold`: the check and cross glyphs are drawn larger and heavier than the others. */
const STATUS_STYLES: Record<
  PaymentStatus,
  { className: string; Icon: typeof Check; bold: boolean }
> = {
  succeeded: { className: SUCCESS, Icon: Check, bold: true },
  pending: { className: WARNING, Icon: Clock3, bold: false },
  failed: { className: DANGER, Icon: X, bold: true },
  refunded: { className: NEUTRAL, Icon: RotateCcw, bold: false },
  canceled: { className: NEUTRAL, Icon: X, bold: true },
  blocked: { className: DANGER, Icon: CircleMinus, bold: false },
};

export function StatusBadge({ status }: { status: PaymentStatus }) {
  const { className, Icon, bold } = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-[4px] border px-1.5 text-[13px] leading-[18px] font-medium whitespace-nowrap',
        className,
      )}
    >
      {STATUS_LABELS[status]}
      <Icon className={bold ? 'size-3.5' : 'size-3'} strokeWidth={bold ? 3 : 2.5} aria-hidden />
    </span>
  );
}

export function AmountCell({ amountMinor, currency }: { amountMinor: number; currency: Currency }) {
  return (
    <span className="flex items-baseline justify-end gap-2 tabular">
      <span className="font-semibold text-fg">{formatAmount(amountMinor, currency)}</span>
      <span className="w-8 text-left text-fg-secondary">{currency}</span>
    </span>
  );
}

export function PaymentMethodCell({ method }: { method: PaymentMethod }) {
  return (
    <span
      className="flex w-fit items-center gap-2"
      aria-label={describePaymentMethod(method)}
      role="img"
    >
      <span className="flex w-11 shrink-0 justify-end gap-1" aria-hidden>
        <PaymentMethodIcons method={method} />
      </span>
      <span className="flex items-center gap-1.5 text-fg tabular" aria-hidden>
        <span className="text-[10px] tracking-[0.08em]">••••</span>
        <span>{method.last4}</span>
      </span>
    </span>
  );
}

/**
 * The tooltip adds the relative time ("3 hours ago"). It is computed when the
 * tooltip opens, so it never ends up in the server HTML.
 */
export function DateCell({ iso }: { iso: string }) {
  return (
    <Tooltip
      content={
        <span className="flex flex-col">
          <RelativeTime iso={iso} />
          <span className="text-fg-secondary">{formatFullDateTime(iso)}</span>
        </span>
      }
    >
      <time dateTime={iso} tabIndex={0} className="rounded-sm whitespace-nowrap text-fg tabular">
        {formatShortDateTime(iso)}
      </time>
    </Tooltip>
  );
}

function RelativeTime({ iso }: { iso: string }) {
  const [now] = useState(() => Date.now());

  return <span className="font-semibold">{formatRelativeTime(iso, now)}</span>;
}

export function EmptyValue() {
  return <span className="text-fg-secondary">—</span>;
}

export function PaymentIdCell({ id }: { id: string }) {
  return (
    <span className="group/id inline-flex max-w-full items-center gap-1">
      <Tooltip content={<span className="font-mono text-[12px]">{id}</span>}>
        <span
          tabIndex={0}
          className="truncate rounded-sm text-fg-secondary tabular"
          aria-label={`Payment ID ${id}`}
        >
          {shortenPaymentId(id)}
        </span>
      </Tooltip>
      {/* Hidden until the row is hovered or focused, but kept visible while it confirms. */}
      <CopyButton
        value={id}
        label={`Copy payment ID ${id}`}
        tooltip="Copy payment ID"
        className="opacity-0 transition-opacity duration-100 group-focus-within/id:opacity-100 group-hover/id:opacity-100 focus-visible:opacity-100 data-[copy-state=copied]:opacity-100 data-[copy-state=failed]:opacity-100 pointer-coarse:opacity-100"
      />
    </span>
  );
}
