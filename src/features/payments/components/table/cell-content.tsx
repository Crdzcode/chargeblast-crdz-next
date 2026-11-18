import { DECLINE_REASON_LABELS } from '../../lib/presentation';
import type { ColumnId } from '../../model/columns';
import type { Transaction } from '../../model/transaction';
import {
  AmountCell,
  DateCell,
  EmptyValue,
  PaymentIdCell,
  PaymentMethodCell,
  StatusBadge,
} from '../cells';

export function CellContent({
  column,
  transaction,
}: {
  readonly column: ColumnId;
  readonly transaction: Transaction;
}) {
  switch (column) {
    case 'amount':
      return <AmountCell amountMinor={transaction.amountMinor} currency={transaction.currency} />;
    case 'status':
      return <StatusBadge status={transaction.status} />;
    case 'paymentMethod':
      return <PaymentMethodCell method={transaction.paymentMethod} />;
    case 'description':
      return <span className="block truncate text-fg">{transaction.description}</span>;
    case 'customer':
      return (
        <span className="block truncate text-fg" title={transaction.customer.email}>
          {transaction.customer.email}
        </span>
      );
    case 'paymentId':
      return <PaymentIdCell id={transaction.id} />;
    case 'created':
      return <DateCell iso={transaction.createdAt} />;
    case 'refundedDate':
      return transaction.refundedAt ? <DateCell iso={transaction.refundedAt} /> : <EmptyValue />;
    case 'declineReason':
      return transaction.declineReason ? (
        <span
          className="block truncate text-fg"
          title={DECLINE_REASON_LABELS[transaction.declineReason]}
        >
          {DECLINE_REASON_LABELS[transaction.declineReason]}
        </span>
      ) : (
        <EmptyValue />
      );
  }
}
