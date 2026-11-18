import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';

import { PaymentIdCell } from '../components/cells';
import { AmountPanel, ChecklistPanel, DatePanel } from '../components/filters/filter-panels';
import { PaymentsTable, type PaymentsTableProps } from '../components/payments-table';
import { TableSearch } from '../components/toolbar/table-search';
import { parseColumnPreferences } from '../hooks/use-column-preferences';
import { DEFAULT_COLUMNS } from '../model/columns';
import { makeTransaction } from './fixtures';

const wrap = (ui: ReactNode) => render(<TooltipProvider>{ui}</TooltipProvider>);

describe('PaymentIdCell', () => {
  const id = 'pi_3QxYz8LkdIwHu7ix0bA1cD2E';
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  it('shows an abbreviated id and copies the full value', async () => {
    writeText.mockResolvedValue(undefined);
    wrap(<PaymentIdCell id={id} />);

    expect(screen.getByText('pi_3QxYz…cD2E')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: `Copy payment ID ${id}` }));

    expect(writeText).toHaveBeenCalledWith(id);
    expect(await screen.findByRole('button', { name: `Copied ${id}` })).toBeInTheDocument();
    expect(screen.getByText('Payment ID copied')).toBeInTheDocument();
  });

  it('does not claim success when the clipboard rejects', async () => {
    writeText.mockRejectedValue(new Error('denied'));
    document.execCommand = vi.fn().mockReturnValue(false);
    wrap(<PaymentIdCell id={id} />);

    await userEvent.click(screen.getByRole('button', { name: `Copy payment ID ${id}` }));

    expect(await screen.findByText('Could not copy the payment ID')).toBeInTheDocument();
    expect(screen.queryByText('Payment ID copied')).not.toBeInTheDocument();
  });
});

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

describe('TableSearch', () => {
  afterEach(() => vi.useRealTimers());

  it('debounces typing and reflects external value changes', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const { rerender } = render(<TableSearch value="" onSearch={onSearch} />);
    const input = screen.getByRole('searchbox');

    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.change(input, { target: { value: '4242' } });
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('4242');

    rerender(<TableSearch value="" onSearch={onSearch} />);
    rerender(<TableSearch value="ava@example.com" onSearch={onSearch} />);
    expect(input).toHaveValue('ava@example.com');
  });
});

describe('PaymentsTable', () => {
  const rows = [
    makeTransaction({ id: 'pi_3AAAAAAAAAAAAAAAAAAAAAAAA', amountMinor: 1000 }),
    makeTransaction({
      id: 'pi_3BBBBBBBBBBBBBBBBBBBBBBBB',
      amountMinor: 2000,
      status: 'failed',
      declineReason: 'do_not_honor',
    }),
  ];

  const setup = (overrides: Partial<PaymentsTableProps> = {}) => {
    const props: PaymentsTableProps = {
      rows,
      columns: DEFAULT_COLUMNS,
      sortBy: 'createdAt',
      sortDirection: 'desc',
      selectedIds: new Set(),
      onSortChange: vi.fn(),
      onToggleRow: vi.fn(),
      onTogglePage: vi.fn(),
      onColumnsChange: vi.fn(),
      onOpenPayment: vi.fn(),
      ...overrides,
    };

    wrap(<PaymentsTable {...props} />);

    return props;
  };

  it('renders the column headers in the reference order with sort state', () => {
    setup();
    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent?.trim());

    expect(headers.slice(1, 8)).toEqual([
      'Amount',
      'Status',
      'Payment method',
      'Description',
      'Customer',
      'Payment ID',
      'Date',
    ]);
    expect(screen.getByRole('columnheader', { name: /Date/ })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
  });

  it('sorts by amount, date and status from the headers', async () => {
    const props = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Amount' }));
    expect(props.onSortChange).toHaveBeenLastCalledWith('amount', 'desc');

    await userEvent.click(screen.getByRole('button', { name: 'Date' }));
    expect(props.onSortChange).toHaveBeenLastCalledWith('createdAt', 'asc');

    await userEvent.click(screen.getByRole('button', { name: 'Status' }));
    expect(props.onSortChange).toHaveBeenLastCalledWith('status', 'desc');
  });

  it('selects rows and the whole page without opening the payment', async () => {
    const props = setup({ selectedIds: new Set([rows[0]?.id ?? '']) });

    expect(
      screen.getByRole('checkbox', { name: 'Select all payments on this page' }),
    ).toHaveAttribute('data-state', 'indeterminate');

    await userEvent.click(screen.getByRole('checkbox', { name: `Select payment ${rows[1]?.id}` }));
    expect(props.onToggleRow).toHaveBeenCalledWith(rows[1]?.id, true);
    expect(props.onOpenPayment).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select all payments on this page' }),
    );
    expect(props.onTogglePage).toHaveBeenCalled();
  });

  it('opens the payment when a row is clicked', async () => {
    const props = setup();
    const row = screen.getByText('Do not honor').closest('tr') as HTMLElement;

    await userEvent.click(within(row).getByText('Subscription update'));
    expect(props.onOpenPayment).toHaveBeenCalledWith(rows[1]?.id);
  });

  it('resizes a column from the keyboard and commits one width', () => {
    const props = setup();
    const separator = screen.getByRole('separator', { name: 'Resize Customer column' });

    fireEvent.keyDown(separator, { key: 'ArrowRight' });
    const [[columns]] = (props.onColumnsChange as ReturnType<typeof vi.fn>).mock.calls as [
      [typeof DEFAULT_COLUMNS],
    ];

    expect(columns.find((column) => column.id === 'customer')?.width).toBe(265);
  });
});

describe('column preferences storage', () => {
  it('falls back to defaults for missing, corrupt or outdated data', () => {
    expect(parseColumnPreferences(null)).toEqual(DEFAULT_COLUMNS);
    expect(parseColumnPreferences('{not json')).toEqual(DEFAULT_COLUMNS);
    expect(parseColumnPreferences(JSON.stringify({ version: 0, columns: [] }))).toEqual(
      DEFAULT_COLUMNS,
    );
  });

  it('restores stored order, width and visibility', () => {
    const restored = parseColumnPreferences(
      JSON.stringify({
        version: 1,
        columns: [{ id: 'description', visible: false, order: 0, width: 200 }],
      }),
    );

    expect(restored[0]).toMatchObject({ id: 'description', visible: false, width: 200 });
  });
});
