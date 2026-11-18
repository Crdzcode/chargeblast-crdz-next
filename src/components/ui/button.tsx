import { Slot } from 'radix-ui';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-control hover:bg-primary-hover active:bg-primary-pressed disabled:opacity-50',
  secondary:
    'border border-line-strong bg-canvas text-fg shadow-control hover:bg-surface-hover active:bg-surface-pressed disabled:text-fg-disabled disabled:hover:bg-canvas',
  ghost:
    'text-fg-secondary hover:bg-surface-hover hover:text-fg active:bg-surface-pressed disabled:text-fg-disabled',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-6 gap-1 rounded-control px-2 text-[13px] leading-4',
  sm: 'h-7 gap-1.5 rounded-control px-2 text-[14px] leading-5',
  md: 'h-8 gap-1.5 rounded-control px-3 text-[14px] leading-5',
  icon: 'size-7 rounded-control',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Passes the button styles to its only child, e.g. a Link. */
  readonly asChild?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'sm',
  asChild = false,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';

  return (
    <Component
      type={asChild ? undefined : type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-colors duration-100 select-none disabled:cursor-default',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
