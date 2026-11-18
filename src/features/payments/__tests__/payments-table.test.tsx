import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PaymentsTable, type PaymentsTableProps } from '../components/payments-table';
import { DEFAULT_COLUMNS } from '../model/columns';
import { makeTransaction } from './fixtures';
import { renderWithTooltips } from './render';

describe('PaymentsTable', () => {
  const rows = [
    makeTransaction({ id: 'pi_3AAAAAAAAAAAAAAAAAAAAAAAA', amountMinor: 1000 }),
    makeTransaction({
      id: 'pi_3BBBBBBBBBBBBBBBBBBBBBBBB',
      amountMinor: 2000,
      status: 'failed',
      declineReason: 'do_not_honor',
    }),
    makeTransaction({ id: 'pi_3CCCCCCCCCCCCCCCCCCCCCCCC', amountMinor: 3000, status: 'pending' }),
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

    renderWithTooltips(<PaymentsTable {...props} />);

    return props;
  };

  it('renders the column headers in the Stripe order with sort state', () => {
    setup();
    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent?.trim());

    expect(headers.slice(1, 10)).toEqual([
      'Amount',
      'Status',
      'Payment method',
      'Description',
      'Customer',
      'Date',
      'Refunded date',
      'Decline reason',
      'Payment ID',
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

    await userEvent.click(screen.getByRole('checkbox', { name: `Select payment ${rows[2]?.id}` }));
    expect(props.onToggleRow).toHaveBeenCalledWith(rows[2]?.id, true);
    expect(props.onOpenPayment).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select all payments on this page' }),
    );
    expect(props.onTogglePage).toHaveBeenCalled();
  });

  it('disables selection for payments that accept no action', () => {
    setup({ selectedIds: new Set([rows[0]?.id ?? '', rows[2]?.id ?? '']) });

    expect(
      screen.getByRole('checkbox', { name: `Failed payment ${rows[1]?.id} cannot be selected` }),
    ).toBeDisabled();
    // Every selectable row on the page is selected, so the page box is checked.
    expect(
      screen.getByRole('checkbox', { name: 'Select all payments on this page' }),
    ).toHaveAttribute('data-state', 'checked');
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
