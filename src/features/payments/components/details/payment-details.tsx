import { CreditCard } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { formatAmount, formatFullDateTime, formatShortDateTime } from '../../lib/format';
import {
  CARD_BRAND_LABELS,
  DECLINE_REASON_LABELS,
  WALLET_LABELS,
  describePaymentMethod,
} from '../../lib/presentation';
import { buildPaymentTimeline, type TimelineTone } from '../../lib/timeline';
import type { PaymentMethod, Transaction } from '../../model/transaction';
import { PaymentMethodIcons } from '../brand-icons';
import { StatusBadge } from '../cells';
import { BackToPayments } from './back-to-payments';
import { CopyButton } from './copy-button';

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <section aria-labelledby={`section-${title}`} className="flex flex-col">
      <h2
        id={`section-${title}`}
        className="border-b border-line-strong pb-2 text-[16px] font-bold"
      >
        {title}
      </h2>
      <div className="pt-3">{children}</div>
    </section>
  );
}

function DefinitionList({ items }: { readonly items: readonly (readonly [string, ReactNode])[] }) {
  return (
    <dl className="grid grid-cols-[minmax(120px,180px)_1fr] gap-x-6 gap-y-2.5 text-[14px]">
      {items.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-fg-secondary">{term}</dt>
          <dd className="min-w-0 break-words text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const TONE_DOT: Record<TimelineTone, string> = {
  neutral: 'bg-fg-disabled',
  success: 'bg-success-icon',
  danger: 'bg-danger-fg',
  warning: 'bg-warning-fg',
  info: 'bg-primary',
};

function methodDetails(method: PaymentMethod): readonly (readonly [string, ReactNode])[] {
  switch (method.type) {
    case 'card':
      return [
        ['Type', `${CARD_BRAND_LABELS[method.brand]} ${method.funding} card`],
        [
          'Number',
          <span key="n" className="tabular">
            •••• {method.last4}
          </span>,
        ],
        [
          'Expires',
          <span key="e" className="tabular">
            {String(method.expMonth).padStart(2, '0')} / {method.expYear}
          </span>,
        ],
        ['Issuing country', method.country],
      ];
    case 'wallet':
      return [
        ['Type', `${WALLET_LABELS[method.wallet]} wallet`],
        ['Card network', CARD_BRAND_LABELS[method.brand]],
        [
          'Number',
          <span key="n" className="tabular">
            •••• {method.last4}
          </span>,
        ],
      ];
    case 'ach':
      return [
        ['Type', 'ACH Direct Debit'],
        ['Bank', method.bankName],
        [
          'Account',
          <span key="a" className="tabular">
            {method.accountType} •••• {method.last4}
          </span>,
        ],
      ];
  }
}

/** Payment details page body: summary, timeline, payment method, details and metadata. */
export function PaymentDetails({ transaction }: { readonly transaction: Transaction }) {
  const timeline = buildPaymentTimeline(transaction);
  const metadata = Object.entries(transaction.metadata);

  return (
    <article className="flex flex-col gap-8 pt-3">
      <div className="flex flex-col gap-4">
        <BackToPayments />
        <div className="flex flex-col gap-2">
          <p className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-fg-secondary">
            <CreditCard className="size-3.5" aria-hidden />
            Payment
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] leading-9 font-bold tabular">
              {formatAmount(transaction.amountMinor, transaction.currency)}{' '}
              <span className="font-normal text-fg-secondary">{transaction.currency}</span>
            </h1>
            <StatusBadge status={transaction.status} />
            {transaction.disputedAt ? (
              <span className="inline-flex h-5 items-center rounded-[4px] border border-warning-line bg-warning-bg px-1.5 text-[13px] font-medium text-warning-fg">
                Disputed
              </span>
            ) : null}
          </div>
          <p className="flex items-center gap-1 text-[14px] text-fg-secondary">
            <span className="font-mono text-[13px]">{transaction.id}</span>
            <CopyButton value={transaction.id} label="Copy payment ID" />
          </p>
        </div>

        <dl className="flex flex-wrap gap-x-10 gap-y-3 border-y border-line py-3 text-[14px]">
          {(
            [
              [
                'Date',
                <time key="d" dateTime={transaction.createdAt}>
                  {formatShortDateTime(transaction.createdAt)}
                </time>,
              ],
              ['Customer', transaction.customer.email],
              [
                'Payment method',
                <span key="m" className="inline-flex items-center gap-1.5">
                  <PaymentMethodIcons method={transaction.paymentMethod} />
                  <span className="tabular">•••• {transaction.paymentMethod.last4}</span>
                </span>,
              ],
              ...(transaction.declineReason
                ? ([['Decline reason', DECLINE_REASON_LABELS[transaction.declineReason]]] as const)
                : []),
              ...(transaction.refundedAt
                ? ([['Refunded', formatShortDateTime(transaction.refundedAt)]] as const)
                : []),
            ] as const
          ).map(([term, value]) => (
            <div key={term} className="flex flex-col gap-0.5">
              <dt className="text-[13px] text-fg-secondary">{term}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-10">
          <Section title="Timeline">
            <ol className="relative flex flex-col gap-5 pl-6 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-line-strong">
              {timeline.map((event) => (
                <li key={event.id} className="relative">
                  <span
                    aria-hidden
                    className={cn(
                      'absolute top-1.5 -left-6 size-[11px] rounded-full ring-4 ring-canvas',
                      TONE_DOT[event.tone],
                    )}
                  />
                  <p className="text-[14px] font-semibold">{event.title}</p>
                  {event.description ? (
                    <p className="text-[14px] text-fg-secondary">{event.description}</p>
                  ) : null}
                  <time dateTime={event.at} className="text-[13px] text-fg-muted tabular">
                    {formatFullDateTime(event.at)}
                  </time>
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Payment method">
            <DefinitionList
              items={[
                ['Description', describePaymentMethod(transaction.paymentMethod)],
                ...methodDetails(transaction.paymentMethod),
                ['Owner', transaction.customer.name],
                ['Owner email', transaction.customer.email],
              ]}
            />
          </Section>
        </div>

        <div className="flex flex-col gap-10">
          <Section title="Details">
            <DefinitionList
              items={[
                [
                  'Payment ID',
                  <span key="id" className="inline-flex items-center gap-1">
                    <span className="font-mono text-[13px] break-all">{transaction.id}</span>
                  </span>,
                ],
                [
                  'Amount',
                  `${formatAmount(transaction.amountMinor, transaction.currency)} ${transaction.currency}`,
                ],
                ['Description', transaction.description],
                ['Created', formatFullDateTime(transaction.createdAt)],
                ['Captured', transaction.captured ? 'Yes' : 'No — awaiting capture'],
                [
                  'Customer',
                  <span key="c">
                    {transaction.customer.name}
                    <br />
                    <span className="text-fg-secondary">{transaction.customer.id}</span>
                  </span>,
                ],
              ]}
            />
          </Section>

          <Section title="Metadata">
            {metadata.length === 0 ? (
              <p className="text-[14px] text-fg-secondary">No metadata</p>
            ) : (
              <DefinitionList
                items={metadata.map(
                  ([key, value]) =>
                    [
                      key,
                      <span key={key} className="font-mono text-[13px]">
                        {value}
                      </span>,
                    ] as const,
                )}
              />
            )}
          </Section>
        </div>
      </div>
    </article>
  );
}
