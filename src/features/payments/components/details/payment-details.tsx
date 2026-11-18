import { CreditCard } from 'lucide-react';
import type { ReactNode } from 'react';

import { CopyButton } from '@/components/ui/copy-button';
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

interface Field {
  readonly label: string;
  readonly value: ReactNode;
}

const TONE_DOT: Record<TimelineTone, string> = {
  neutral: 'bg-fg-disabled',
  success: 'bg-success-icon',
  danger: 'bg-danger-fg',
  warning: 'bg-warning-fg',
  info: 'bg-primary',
};

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  const headingId = `section-${title.toLowerCase().replaceAll(' ', '-')}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col">
      <h2 id={headingId} className="border-b border-line-strong pb-2 text-[16px] font-bold">
        {title}
      </h2>
      <div className="pt-3">{children}</div>
    </section>
  );
}

function DefinitionList({ fields }: { readonly fields: readonly Field[] }) {
  return (
    <dl className="grid grid-cols-[112px_1fr] gap-x-4 gap-y-2.5 text-[14px] sm:grid-cols-[minmax(120px,180px)_1fr] sm:gap-x-6">
      {fields.map(({ label, value }) => (
        <div key={label} className="contents">
          <dt className="text-fg-secondary">{label}</dt>
          <dd className="min-w-0 break-words text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MaskedNumber({ last4, prefix }: { readonly last4: string; readonly prefix?: string }) {
  return (
    <span className="tabular">
      {prefix ? `${prefix} ` : null}•••• {last4}
    </span>
  );
}

function summaryFields(transaction: Transaction): Field[] {
  const fields: Field[] = [
    {
      label: 'Date',
      value: (
        <time dateTime={transaction.createdAt}>{formatShortDateTime(transaction.createdAt)}</time>
      ),
    },
    { label: 'Customer', value: transaction.customer.email },
    {
      label: 'Payment method',
      value: (
        <span className="inline-flex items-center gap-1.5">
          <PaymentMethodIcons method={transaction.paymentMethod} />
          <MaskedNumber last4={transaction.paymentMethod.last4} />
        </span>
      ),
    },
  ];

  if (transaction.declineReason) {
    fields.push({
      label: 'Decline reason',
      value: DECLINE_REASON_LABELS[transaction.declineReason],
    });
  }

  if (transaction.refundedAt) {
    fields.push({ label: 'Refunded', value: formatShortDateTime(transaction.refundedAt) });
  }

  return fields;
}

function paymentMethodFields(method: PaymentMethod): Field[] {
  switch (method.type) {
    case 'card':
      return [
        { label: 'Type', value: `${CARD_BRAND_LABELS[method.brand]} ${method.funding} card` },
        { label: 'Number', value: <MaskedNumber last4={method.last4} /> },
        {
          label: 'Expires',
          value: (
            <span className="tabular">
              {String(method.expMonth).padStart(2, '0')} / {method.expYear}
            </span>
          ),
        },
        { label: 'Issuing country', value: method.country },
      ];
    case 'wallet':
      return [
        { label: 'Type', value: `${WALLET_LABELS[method.wallet]} wallet` },
        { label: 'Card network', value: CARD_BRAND_LABELS[method.brand] },
        { label: 'Number', value: <MaskedNumber last4={method.last4} /> },
      ];
    case 'ach':
      return [
        { label: 'Type', value: 'ACH Direct Debit' },
        { label: 'Bank', value: method.bankName },
        {
          label: 'Account',
          value: <MaskedNumber last4={method.last4} prefix={method.accountType} />,
        },
      ];
  }
}

function detailFields(transaction: Transaction): Field[] {
  const { amountMinor, currency, customer } = transaction;

  return [
    {
      label: 'Payment ID',
      value: <span className="font-mono text-[13px] break-all">{transaction.id}</span>,
    },
    { label: 'Amount', value: `${formatAmount(amountMinor, currency)} ${currency}` },
    { label: 'Description', value: transaction.description },
    { label: 'Created', value: formatFullDateTime(transaction.createdAt) },
    { label: 'Captured', value: transaction.captured ? 'Yes' : 'No, awaiting capture' },
    {
      label: 'Customer',
      value: (
        <span>
          {customer.name}
          <br />
          <span className="text-fg-secondary">{customer.id}</span>
        </span>
      ),
    },
  ];
}

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
          {summaryFields(transaction).map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-[13px] text-fg-secondary">{label}</dt>
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
              fields={[
                { label: 'Description', value: describePaymentMethod(transaction.paymentMethod) },
                ...paymentMethodFields(transaction.paymentMethod),
                { label: 'Owner', value: transaction.customer.name },
                { label: 'Owner email', value: transaction.customer.email },
              ]}
            />
          </Section>
        </div>

        <div className="flex flex-col gap-10">
          <Section title="Details">
            <DefinitionList fields={detailFields(transaction)} />
          </Section>

          <Section title="Metadata">
            {metadata.length === 0 ? (
              <p className="text-[14px] text-fg-secondary">No metadata</p>
            ) : (
              <DefinitionList
                fields={metadata.map(([key, value]) => ({
                  label: key,
                  value: <span className="font-mono text-[13px]">{value}</span>,
                }))}
              />
            )}
          </Section>
        </div>
      </div>
    </article>
  );
}
