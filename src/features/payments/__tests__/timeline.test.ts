import { describe, expect, it } from 'vitest';

import { buildPaymentTimeline } from '../lib/timeline';
import { makeTransaction } from './fixtures';

describe('payment timeline', () => {
  it('describes a refunded payment from newest to oldest', () => {
    const events = buildPaymentTimeline(
      makeTransaction({ status: 'refunded', refundedAt: '2026-11-19T10:00:00.000Z' }),
    );

    expect(events.map((event) => event.title)).toEqual([
      'Payment refunded',
      'Payment succeeded',
      'Payment started',
    ]);
  });

  it('includes the decline reason for failed payments and authorization for uncaptured ones', () => {
    const failed = buildPaymentTimeline(
      makeTransaction({ status: 'failed', declineReason: 'expired_card' }),
    );
    const uncaptured = buildPaymentTimeline(
      makeTransaction({ status: 'pending', captured: false }),
    );

    expect(failed[0]?.description).toContain('Expired card');
    expect(uncaptured[0]?.title).toBe('Payment authorized');
  });

  it('describes canceled and blocked payments', () => {
    expect(buildPaymentTimeline(makeTransaction({ status: 'canceled' }))[0]?.title).toBe(
      'Payment canceled',
    );
    expect(buildPaymentTimeline(makeTransaction({ status: 'blocked' }))[0]?.title).toBe(
      'Payment blocked',
    );
  });
});
