'use client';

import type { ReactElement } from 'react';

import { Tooltip } from './tooltip';

export const UNAVAILABLE_MESSAGE = 'Not available in this demo';

/**
 * Wraps a control that exists in the reference but is outside this demo's
 * scope. It keeps the reference look while saying so on hover and focus,
 * instead of pretending to navigate or act.
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
