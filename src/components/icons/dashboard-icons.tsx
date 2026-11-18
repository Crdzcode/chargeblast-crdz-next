import { Pin } from 'lucide-react';
import type { SVGProps } from 'react';

import { cn } from '@/lib/cn';

/**
 * Icons that lucide doesn't have, drawn on its 24×24 grid with a 2px stroke so
 * they match the rest.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Outline({ children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Balances: stacked lines with a coin. */
export function BalancesIcon(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M4 6h16M4 11.5h11M4 17h6" />
      <circle cx="17" cy="17" r="2.75" />
    </Outline>
  );
}

/** Payments analytics: a pushpin tilted to the right. */
export function PushPinIcon({ className, ...props }: IconProps) {
  return <Pin className={cn('rotate-45', className)} {...props} />;
}

/** Export: an arrow leaving a tray. */
export function ExportIcon(props: IconProps) {
  return (
    <Outline {...props}>
      <path d="M4 14v5.5h16V14" />
      <path d="M8.5 15v-2.5a4.5 4.5 0 0 1 4.5-4.5h6" />
      <path d="m16 5 3 3-3 3" />
    </Outline>
  );
}

/** Apps launcher: three tiles and a plus. */
export function AppsIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      focusable="false"
      {...props}
    >
      <rect x="1.7" y="1.7" width="5" height="5" rx="1.2" />
      <rect x="1.7" y="9.3" width="5" height="5" rx="1.2" />
      <rect x="9.3" y="9.3" width="5" height="5" rx="1.2" />
      <path d="M11.8 1.5v5M9.3 4h5" strokeLinecap="round" />
    </svg>
  );
}
