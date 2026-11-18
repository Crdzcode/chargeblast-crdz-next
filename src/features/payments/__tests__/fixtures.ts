import type { Transaction } from '../model/transaction';

/** Builds a valid transaction with overridable fields for focused tests. */
export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'pi_3AAAAAAAAAAAAAAAAAAAAAAAA',
    amountMinor: 2198,
    currency: 'USD',
    status: 'succeeded',
    captured: true,
    description: 'Subscription update',
    paymentMethod: {
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expMonth: 4,
      expYear: 2029,
      funding: 'credit',
      country: 'US',
    },
    customer: { id: 'cus_00000000000001', name: 'Ava King', email: 'ava.king@example.com' },
    createdAt: '2026-11-18T15:00:00.000Z',
    refundedAt: null,
    declineReason: null,
    disputedAt: null,
    metadata: {},
    ...overrides,
  };
}
