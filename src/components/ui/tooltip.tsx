'use client';

import { Tooltip as TooltipPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function TooltipProvider({ children }: { readonly children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={250} skipDelayDuration={150}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export interface TooltipProps {
  /** Only rendered while open, so it can hold text that depends on the current time. */
  readonly content: ReactNode | (() => ReactNode);
  /** One focusable element. Hovering it or focusing it with the keyboard opens the tooltip. */
  readonly children: ReactNode;
  readonly side?: 'top' | 'right' | 'bottom' | 'left';
  readonly align?: 'start' | 'center' | 'end';
  readonly className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            'z-50 max-w-xs animate-pop-in rounded-control bg-canvas px-2.5 py-1.5 text-[13px] leading-[18px] text-fg shadow-popover',
            className,
          )}
        >
          {typeof content === 'function' ? content() : content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
