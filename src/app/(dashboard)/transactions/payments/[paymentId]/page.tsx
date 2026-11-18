import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { findTransactionById } from '@/features/payments/data/payments-repository';
import { getReferenceTime } from '@/features/payments/data/reference-time';
import { PaymentDetails } from '@/features/payments/components/details/payment-details';
import { shortenPaymentId } from '@/features/payments/lib/presentation';

interface PaymentDetailsPageProps {
  readonly params: Promise<{ paymentId: string }>;
}

export async function generateMetadata({ params }: PaymentDetailsPageProps): Promise<Metadata> {
  const { paymentId } = await params;

  return { title: `Payment ${shortenPaymentId(decodeURIComponent(paymentId))}` };
}

export default async function PaymentDetailsPage({ params }: PaymentDetailsPageProps) {
  const { paymentId } = await params;
  const transaction = findTransactionById(decodeURIComponent(paymentId), await getReferenceTime());

  if (!transaction) {
    notFound();
  }

  return <PaymentDetails transaction={transaction} />;
}
