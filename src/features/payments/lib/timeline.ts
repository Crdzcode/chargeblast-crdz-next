import type { Transaction } from '../model/transaction';
import { formatAmount } from './format';
import { DECLINE_REASON_LABELS, describePaymentMethod } from './presentation';

export type TimelineTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';

export interface TimelineEvent {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  /** ISO-8601 instant. */
  readonly at: string;
  readonly tone: TimelineTone;
}

function shift(iso: string, ms: number): string {
  return new Date(Date.parse(iso) + ms).toISOString();
}

/**
 * The payment's events, newest first, worked out from its fields. Events from
 * the same request (created, authorized, succeeded) get a few seconds between
 * them.
 */
export function buildPaymentTimeline(transaction: Transaction): readonly TimelineEvent[] {
  const amount = formatAmount(transaction.amountMinor, transaction.currency);
  const method = describePaymentMethod(transaction.paymentMethod);
  const events: TimelineEvent[] = [
    {
      id: 'created',
      title: 'Payment started',
      description: `${amount} ${transaction.currency} payment created for ${transaction.customer.email}`,
      at: transaction.createdAt,
      tone: 'neutral',
    },
  ];

  switch (transaction.status) {
    case 'failed':
      events.push({
        id: 'failed',
        title: 'Payment failed',
        description: transaction.declineReason
          ? `${method} was declined: ${DECLINE_REASON_LABELS[transaction.declineReason]}`
          : `${method} was declined`,
        at: shift(transaction.createdAt, 2_000),
        tone: 'danger',
      });
      break;

    case 'canceled':
      events.push({
        id: 'canceled',
        title: 'Payment canceled',
        description: `The authorization on ${method} was released before capture`,
        at: shift(transaction.createdAt, 2_000),
        tone: 'neutral',
      });
      break;

    case 'blocked':
      events.push({
        id: 'blocked',
        title: 'Payment blocked',
        description: 'Blocked by a fraud rule because the risk level was too high',
        at: shift(transaction.createdAt, 2_000),
        tone: 'danger',
      });
      break;

    case 'pending':
      events.push(
        transaction.captured
          ? {
              id: 'processing',
              title: 'ACH debit initiated',
              description: `Funds from ${method} usually settle in 4 business days`,
              at: shift(transaction.createdAt, 2_000),
              tone: 'warning',
            }
          : {
              id: 'authorized',
              title: 'Payment authorized',
              description: `${amount} ${transaction.currency} is held on ${method} and awaits capture`,
              at: shift(transaction.createdAt, 2_000),
              tone: 'info',
            },
      );
      break;

    case 'succeeded':
    case 'refunded':
      events.push({
        id: 'succeeded',
        title: 'Payment succeeded',
        description: `Charged ${method}`,
        at: shift(transaction.createdAt, 2_000),
        tone: 'success',
      });
      break;
  }

  if (transaction.refundedAt) {
    events.push({
      id: 'refunded',
      title: 'Payment refunded',
      description: `${amount} ${transaction.currency} was refunded to ${method}`,
      at: transaction.refundedAt,
      tone: 'neutral',
    });
  }

  if (transaction.disputedAt) {
    events.push({
      id: 'disputed',
      title: 'Dispute opened',
      description: 'The cardholder disputed this payment with their bank',
      at: transaction.disputedAt,
      tone: 'warning',
    });
  }

  return events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
