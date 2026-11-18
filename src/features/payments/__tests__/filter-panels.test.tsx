import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AmountPanel,
  ChecklistPanel,
  DatePanel,
  SearchPanel,
} from '../components/filters/filter-panels';

describe('filter panels', () => {
  it('applies a multi-select checklist in option order', async () => {
    const onApply = vi.fn();
    render(
      <ChecklistPanel
        name="Status"
        options={[
          { value: 'succeeded', label: 'Succeeded' },
          { value: 'pending', label: 'Pending' },
          { value: 'failed', label: 'Failed' },
        ]}
        selected={[]}
        onApply={onApply}
      />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Failed' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Succeeded' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).toHaveBeenCalledWith(['succeeded', 'failed']);
  });

  it('validates amount ranges and converts to minor units', async () => {
    const onApply = vi.fn();
    render(<AmountPanel min={null} max={null} onApply={onApply} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Minimum amount' }), '50');
    await userEvent.type(screen.getByRole('textbox', { name: 'Maximum amount' }), '10.5');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(screen.getByRole('alert')).toHaveTextContent('must not be greater');
    expect(onApply).not.toHaveBeenCalled();

    await userEvent.clear(screen.getByRole('textbox', { name: 'Maximum amount' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Maximum amount' }), '99,99');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).toHaveBeenCalledWith(5000, 9999);
  });

  it('supports the "is equal to" operator', async () => {
    const onApply = vi.fn();
    render(<AmountPanel min={null} max={null} onApply={onApply} />);

    await userEvent.selectOptions(
      screen.getByRole('combobox', { name: 'Amount condition' }),
      'equal',
    );
    await userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '21.98');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).toHaveBeenCalledWith(2198, 2198);
  });

  it('edits the search term from the Search chip', async () => {
    const onApply = vi.fn();
    render(<SearchPanel value="4242" onApply={onApply} />);

    const input = screen.getByRole('searchbox');
    await userEvent.clear(input);
    await userEvent.type(input, '  ava@example.com ');
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(onApply).toHaveBeenCalledWith('ava@example.com');
  });

  it('applies date presets and blocks inverted custom ranges', async () => {
    const onApply = vi.fn();
    const { container } = render(<DatePanel value={null} onApply={onApply} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Today' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenLastCalledWith({ preset: 'today' });

    await userEvent.click(screen.getByRole('radio', { name: 'Custom' }));
    const [from, to] = Array.from(container.querySelectorAll('input[type="date"]'));
    fireEvent.change(from as HTMLInputElement, { target: { value: '2026-11-10' } });
    fireEvent.change(to as HTMLInputElement, { target: { value: '2026-11-01' } });

    expect(screen.getByRole('alert')).toHaveTextContent('on or before');
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();

    fireEvent.change(to as HTMLInputElement, { target: { value: '2026-11-12' } });
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onApply).toHaveBeenLastCalledWith({
      preset: 'custom',
      from: '2026-11-10',
      to: '2026-11-12',
    });
  });
});
