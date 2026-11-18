import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Payments',
    template: '%s · cramly.ai',
  },
  description:
    'Stripe Dashboard Payments screen rebuilt with Next.js for the Chargeblast front-end project.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
