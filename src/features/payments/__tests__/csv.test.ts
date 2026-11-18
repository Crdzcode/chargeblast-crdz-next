import { describe, expect, it } from 'vitest';

import { buildCsvFilename, buildPaymentsCsv, escapeCsvValue } from '../lib/csv';
import { DEFAULT_COLUMNS, visibleColumns } from '../model/columns';
import { makeTransaction } from './fixtures';

describe('CSV export', () => {
  const columns = visibleColumns(DEFAULT_COLUMNS).filter((column) =>
    ['paymentId', 'amount', 'customer', 'declineReason'].includes(column.id),
  );

  it('uses the visible column order, full values and RFC 4180 formatting', () => {
    const csv = buildPaymentsCsv(
      [
        makeTransaction({ id: 'pi_3QxYz8LkdIwHu7ix0bA1cD2E' }),
        makeTransaction({ status: 'failed', declineReason: 'do_not_honor', amountMinor: 123456 }),
      ],
      columns,
    );

    expect(csv.startsWith('﻿Amount,Customer,Decline reason,Payment ID\r\n')).toBe(true);
    expect(csv).toContain('$21.98 USD,ava.king@example.com,,pi_3QxYz8LkdIwHu7ix0bA1cD2E\r\n');
    expect(csv).toContain('"$1,234.56 USD"');
    expect(csv.endsWith('Do not honor,pi_3AAAAAAAAAAAAAAAAAAAAAAAA\r\n')).toBe(true);
  });

  it('escapes quotes and neutralizes spreadsheet formulas', () => {
    expect(escapeCsvValue('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvValue('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(escapeCsvValue('plain')).toBe('plain');
  });

  it('builds descriptive filenames', () => {
    const date = new Date(2026, 10, 18, 9, 5);

    expect(buildCsvFilename(date, 'view')).toBe('payments-2026-11-18-0905.csv');
    expect(buildCsvFilename(date, 'selected')).toBe('payments-selected-2026-11-18-0905.csv');
  });
});
