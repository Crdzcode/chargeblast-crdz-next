import type { ColumnConfig, ColumnId } from '../model/columns';
import type { Transaction } from '../model/transaction';
import { formatAmount } from './format';
import { DECLINE_REASON_LABELS, STATUS_LABELS, describePaymentMethod } from './presentation';

/**
 * Full (never abbreviated) CSV value per column. Dates are ISO 8601 for
 * interoperability; amounts are unambiguous, e.g. "$21.98 USD".
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

/** Cells that could be interpreted as formulas by spreadsheet apps. */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** RFC 4180 escaping plus CSV-injection hardening for user-controlled text. */
export function escapeCsvValue(value: string): string {
  const safe = FORMULA_PREFIX.test(value) ? `'${value}` : value;

  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * Builds an RFC 4180 CSV (CRLF line endings, UTF-8 BOM for spreadsheet
 * apps) using exactly the given columns in the given order.
 */
export function buildPaymentsCsv(
  transactions: readonly Transaction[],
  columns: readonly ColumnConfig[],
): string {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(',');
  const rows = transactions.map((transaction) =>
    columns.map((column) => escapeCsvValue(COLUMN_VALUES[column.id](transaction))).join(','),
  );

  return `﻿${[header, ...rows].join('\r\n')}\r\n`;
}

/** Suggested filename, e.g. `payments-2026-11-18-1405.csv` (local wall clock). */
export function buildCsvFilename(now: Date, scope: 'view' | 'selected'): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;

  return scope === 'selected' ? `payments-selected-${stamp}.csv` : `payments-${stamp}.csv`;
}
