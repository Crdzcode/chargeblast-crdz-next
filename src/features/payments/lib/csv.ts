import type { ColumnConfig, ColumnId } from '../model/columns';
import type { Transaction } from '../model/transaction';
import { formatAmount } from './format';
import { DECLINE_REASON_LABELS, STATUS_LABELS, describePaymentMethod } from './presentation';

/**
 * The CSV value for each column. IDs are never shortened, dates are ISO 8601
 * and amounts include the currency, e.g. "$21.98 USD".
 */
const COLUMN_VALUES: Record<ColumnId, (transaction: Transaction) => string> = {
  amount: (transaction) =>
    `${formatAmount(transaction.amountMinor, transaction.currency)} ${transaction.currency}`,
  status: (transaction) => STATUS_LABELS[transaction.status],
  paymentMethod: (transaction) => describePaymentMethod(transaction.paymentMethod),
  description: (transaction) => transaction.description,
  customer: (transaction) => transaction.customer.email,
  paymentId: (transaction) => transaction.id,
  created: (transaction) => transaction.createdAt,
  refundedDate: (transaction) => transaction.refundedAt ?? '',
  declineReason: (transaction) =>
    transaction.declineReason ? DECLINE_REASON_LABELS[transaction.declineReason] : '',
};

/** Spreadsheet apps would run a cell starting with one of these as a formula. */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Quotes values per RFC 4180 and defuses formulas in user-entered text. */
export function escapeCsvValue(value: string): string {
  const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;

  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Makes Excel open the file as UTF-8, so "€" and "£" survive. */
const UTF8_BOM = '\uFEFF';

/** RFC 4180 CSV (CRLF line endings) with exactly these columns, in this order. */
export function buildPaymentsCsv(
  transactions: readonly Transaction[],
  columns: readonly ColumnConfig[],
): string {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(',');
  const rows = transactions.map((transaction) =>
    columns.map((column) => escapeCsvValue(COLUMN_VALUES[column.id](transaction))).join(','),
  );

  return `${UTF8_BOM}${[header, ...rows].join('\r\n')}\r\n`;
}

/** Suggested filename, e.g. `payments-2026-11-18-1405.csv` (local wall clock). */
export function buildCsvFilename(now: Date, scope: 'view' | 'selected'): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

  return scope === 'selected' ? `payments-selected-${stamp}.csv` : `payments-${stamp}.csv`;
}
