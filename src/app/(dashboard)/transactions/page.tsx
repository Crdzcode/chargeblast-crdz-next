import { redirect } from 'next/navigation';

import { PAYMENTS_PATH } from '@/features/payments/routes';

export default function TransactionsPage() {
  redirect(PAYMENTS_PATH);
}
