import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

/** Components with tooltips need the provider around them. */
export function renderWithTooltips(ui: ReactNode) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}
