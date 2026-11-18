'use client';

import { Check, Copy, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { copyText } from '@/lib/clipboard';
import { cn } from '@/lib/cn';

import { Tooltip } from './tooltip';

const FEEDBACK_MS = 1500;

export type CopyState = 'idle' | 'copied' | 'failed';

const ICONS = { idle: Copy, copied: Check, failed: X };
const ICON_COLORS = { idle: '', copied: 'text-success-icon', failed: 'text-danger-fg' };
const ANNOUNCEMENTS = { idle: '', copied: 'Copied to clipboard', failed: 'Could not copy' };

/**
 * Copy with a short "copied" or "failed" state afterwards. It only reports
 * "copied" once the clipboard write has actually succeeded.
 */
export function useCopyFeedback() {
  const [state, setState] = useState<CopyState>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async (text: string) => {
    const succeeded = await copyText(text);

    setState(succeeded ? 'copied' : 'failed');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState('idle'), FEEDBACK_MS);
  };

  return { state, copy };
}

interface CopyButtonProps {
  readonly value: string;
  /** Accessible name while idle. */
  readonly label: string;
  readonly tooltip?: string;
  readonly className?: string;
}

/**
 * Icon button that copies `value`. While the "Copied" feedback shows, the
 * button carries `data-copy-state`, so callers that hide it until hover can
 * keep it visible.
 */
export function CopyButton({ value, label, tooltip = label, className }: CopyButtonProps) {
  const { state, copy } = useCopyFeedback();
  const Icon = ICONS[state];

  let tooltipText = tooltip;
  if (state === 'copied') tooltipText = 'Copied';
  if (state === 'failed') tooltipText = 'Copy failed';

  return (
    <>
      <Tooltip content={tooltipText}>
        <button
          type="button"
          onClick={() => void copy(value)}
          aria-label={state === 'copied' ? `Copied ${value}` : label}
          data-copy-state={state}
          className={cn(
            'inline-flex size-6 shrink-0 items-center justify-center rounded-control text-fg-muted hover:bg-surface-hover hover:text-fg',
            className,
          )}
        >
          <Icon className={cn('size-3.5', ICON_COLORS[state])} aria-hidden />
        </button>
      </Tooltip>
      <span aria-live="polite" className="sr-only">
        {ANNOUNCEMENTS[state]}
      </span>
    </>
  );
}
