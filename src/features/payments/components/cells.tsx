'use client';

import { Check, Clock3, Copy, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { copyText } from '@/lib/clipboard';

import {
  formatAmount,
  formatFullDateTime,
  formatRelativeTime,
  formatShortDateTime,
} from '../lib/format';
import { STATUS_LABELS, describePaymentMethod, shortenPaymentId } from '../lib/presentation';
import type { Currency, PaymentMethod, PaymentStatus } from '../model/transaction';
import { PaymentMethodIcons } from './brand-icons';

const STATUS_STYLES: Record<PaymentStatus, { className: string; Icon: typeof Check }> = {
  succeeded: { className: 'border-success-line bg-success-bg text-success-fg', Icon: Check },
  pending: { className: 'border-warning-line bg-warning-bg text-warning-fg', Icon: Clock3 },
  failed: { className: 'border-danger-line bg-danger-bg text-danger-fg', Icon: X },
  refunded: { className: 'border-neutral-line bg-neutral-bg text-neutral-fg', Icon: RotateCcw },
};

/** Status badge: label plus icon, so status never relies on color alone. */
export function StatusBadge({ status }: { status: PaymentStatus }) {
  const { className, Icon } = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-[4px] border px-1.5 text-[13px] leading-[18px] font-medium whitespace-nowrap',
        className,
      )}
    >
      {STATUS_LABELS[status]}
      <Icon className="size-3" strokeWidth={2.5} aria-hidden />
    </span>
  );
}

/** Bold amount right-aligned, ISO currency code muted beside it. */
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
      className="inline-flex items-center gap-2"
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
 * Date and time in the account zone. The tooltip shows the relative time
 * ("3 hours ago"), computed when it opens so it is always current and never
 * part of the server HTML.
 */
export function DateCell({ iso, muted = false }: { iso: string; muted?: boolean }) {
  return (
    <Tooltip
      content={
        <span className="flex flex-col">
          <RelativeTime iso={iso} />
          <span className="text-fg-secondary">{formatFullDateTime(iso)}</span>
        </span>
      }
    >
      <time
        dateTime={iso}
        tabIndex={0}
        className={cn(
          'rounded-sm whitespace-nowrap tabular',
          muted ? 'text-fg-secondary' : 'text-fg',
        )}
      >
        {formatShortDateTime(iso)}
      </time>
    </Tooltip>
  );
}

/** Relative time captured when mounted (i.e. when the tooltip opens). */
function RelativeTime({ iso }: { iso: string }) {
  const [now] = useState(() => Date.now());

  return <span className="font-semibold">{formatRelativeTime(iso, now)}</span>;
}

export function EmptyValue() {
  return <span className="text-fg-secondary">—</span>;
}

const COPIED_FEEDBACK_MS = 1500;

type CopyState = 'idle' | 'copied' | 'failed';

/** Shows "Copied" only after the clipboard write resolves successfully. */
export function useCopy(text: string) {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const succeeded = await copyText(text);

    setState(succeeded ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), COPIED_FEEDBACK_MS);
  };

  return { state, copy };
}

/** Abbreviated payment ID with the full value in a tooltip and a copy button. */
export function PaymentIdCell({ id }: { id: string }) {
  const { state, copy } = useCopy(id);

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
      <Tooltip
        content={
          state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy payment ID'
        }
      >
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            void copy();
          }}
          aria-label={state === 'copied' ? `Copied ${id}` : `Copy payment ID ${id}`}
          className={cn(
            'inline-flex size-6 shrink-0 items-center justify-center rounded-control text-fg-muted opacity-0 transition-opacity duration-100 group-focus-within/id:opacity-100 group-hover/id:opacity-100 hover:bg-surface-hover hover:text-fg focus-visible:opacity-100 pointer-coarse:opacity-100',
            state !== 'idle' && 'opacity-100',
          )}
        >
          {state === 'copied' ? (
            <Check className="size-3.5 text-success-icon" aria-hidden />
          ) : state === 'failed' ? (
            <X className="size-3.5 text-danger-fg" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
        </button>
      </Tooltip>
      <span aria-live="polite" className="sr-only">
        {state === 'copied'
          ? 'Payment ID copied'
          : state === 'failed'
            ? 'Could not copy the payment ID'
            : ''}
      </span>
    </span>
  );
}
