'use client';

import type { ReactElement } from 'react';

import { Tooltip } from './tooltip';

export const UNAVAILABLE_MESSAGE = 'Not available in this demo';

/**
 * For controls that are on the Stripe screen but outside this demo. They keep
 * their look and say "Not available in this demo" on hover and focus.
 */
export function Unavailable({
  children,
  side = 'bottom',
  message = UNAVAILABLE_MESSAGE,
}: {
  readonly children: ReactElement;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly message?: string;
}) {
  return (
    <Tooltip content={message} side={side}>
      {children}
    </Tooltip>
  );
}
