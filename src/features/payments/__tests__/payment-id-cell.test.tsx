import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentIdCell } from '../components/cells';
import { renderWithTooltips } from './render';

describe('PaymentIdCell', () => {
  const id = 'pi_3QxYz8LkdIwHu7ix0bA1cD2E';
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  it('shows an abbreviated id and copies the full value', async () => {
    writeText.mockResolvedValue(undefined);
    renderWithTooltips(<PaymentIdCell id={id} />);

    expect(screen.getByText('pi_3QxYz…cD2E')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: `Copy payment ID ${id}` }));

    expect(writeText).toHaveBeenCalledWith(id);
    expect(await screen.findByRole('button', { name: `Copied ${id}` })).toBeInTheDocument();
    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument();
  });

  it('does not claim success when the clipboard rejects', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    document.execCommand = vi.fn().mockReturnValue(false);
    renderWithTooltips(<PaymentIdCell id={id} />);

    await userEvent.click(screen.getByRole('button', { name: `Copy payment ID ${id}` }));

    expect(await screen.findByText('Could not copy')).toBeInTheDocument();
    expect(screen.queryByText('Copied to clipboard')).not.toBeInTheDocument();
  });
});
