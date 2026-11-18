'use client';

import { Check, Copy, X } from 'lucide-react';

import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

import { useCopy } from '../cells';

/** Small icon button that copies `value` and confirms only after success. */
export function CopyButton({ value, label }: { readonly value: string; readonly label: string }) {
  const { state, copy } = useCopy(value);

  return (
    <Tooltip content={state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={state === 'copied' ? `Copied ${value}` : label}
        className={cn(
          'inline-flex size-6 shrink-0 items-center justify-center rounded-control text-fg-muted hover:bg-surface-hover hover:text-fg',
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
  );
}
