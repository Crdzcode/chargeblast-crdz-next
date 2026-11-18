import {
  APP_TIME_ZONE,
  DAY_MS,
  addCalendarDays,
  startOfZonedDay,
  toCalendarDate,
} from '@/lib/time-zone';

import type {
  Currency,
  Customer,
  DeclineReason,
  PaymentMethod,
  PaymentStatus,
  Transaction,
} from '../model/transaction';
import {
  BANK_NAMES,
  BRAND_WEIGHTS,
  CARD_COUNTRY,
  CURRENCY_WEIGHTS,
  DECLINE_WEIGHTS,
  DESCRIPTION_WEIGHTS,
  EMAIL_DOMAINS,
  FIRST_NAMES,
  LAST_NAMES,
  OTHER_METHOD_WEIGHTS,
  PLANS,
  PRICES,
  USD_METHOD_WEIGHTS,
  WALLET_WEIGHTS,
  statusWeights,
} from './mock-catalog';
import { createRandom, type Random } from './random';

/*
 * How the mock data stays fresh.
 *
 * Each payment starts as a fixed "blueprint" (id, customer, amount, status,
 * method...) plus where it sits relative to today: `dayOffset` days back, at
 * a fixed minute of that day. Turning the blueprints into transactions for a
 * given "now" gives a daily snapshot. A payment keeps its id and details from
 * one day to the next, and Today / 7 days / 30 days always have rows.
 *
 * - A payment whose minute hasn't come yet today is left out until it does,
 *   so nothing is dated in the future.
 * - A few "live" payments sit minutes before the current hour, so Today has
 *   rows even just after midnight.
 * - Refund and dispute dates depend on how far the payment is from the start
 *   of today, so they don't move during the day and never land in the future.
 *
 * "Now" is always passed in (no Math.random or new Date in here), so the
 * server, the browser and the tests all build the same data.
 */

export const DATASET_SEED = 0x5eed_2026;

type Placement =
  | { readonly kind: 'live'; readonly minutesBeforeHour: number; readonly second: number }
  | {
      readonly kind: 'day';
      readonly dayOffset: number;
      readonly minuteOfDay: number;
      readonly second: number;
    };

interface Blueprint {
  readonly id: string;
  readonly placement: Placement;
  readonly amountMinor: number;
  readonly currency: Currency;
  readonly status: PaymentStatus;
  readonly captured: boolean;
  readonly description: string;
  readonly paymentMethod: PaymentMethod;
  readonly customer: Customer;
  readonly declineReason: DeclineReason | null;
  /** Fractions in (0, 1] used to place refund/dispute dates. */
  readonly refundDelay: number | null;
  readonly disputeDelay: number | null;
  readonly metadata: Readonly<Record<string, string>>;
}

/** How many payments fall in each age band (1,000 in total). */
const AGE_BANDS: readonly { count: number; place: (random: Random) => Placement }[] = [
  {
    count: 8,
    place: (random) => ({
      kind: 'live',
      minutesBeforeHour: random.int(1, 55),
      second: random.int(0, 59),
    }),
  },
  { count: 72, place: (random) => dayPlacement(random, 0, 0) },
  { count: 170, place: (random) => dayPlacement(random, 1, 6) },
  { count: 300, place: (random) => dayPlacement(random, 7, 29) },
  { count: 450, place: (random) => dayPlacement(random, 30, 119) },
];

function dayPlacement(random: Random, minDays: number, maxDays: number): Placement {
  // Business-hours bias: most payments between 08:00 and 23:00.
  const minuteOfDay = random.chance(0.85) ? random.int(8 * 60, 23 * 60 + 59) : random.int(0, 479);

  return {
    kind: 'day',
    dayOffset: random.int(minDays, maxDays),
    minuteOfDay,
    second: random.int(0, 59),
  };
}

function placementAgeDays(placement: Placement): number {
  return placement.kind === 'live' ? 0 : placement.dayOffset;
}

const CUSTOMER_COUNT = 320;

function createCustomers(random: Random): readonly Customer[] {
  const customers: Customer[] = [];
  const emails = new Set<string>();

  while (customers.length < CUSTOMER_COUNT) {
    const first = random.pick(FIRST_NAMES);
    const last = random.pick(LAST_NAMES);
    const separator = random.pick(['.', '_', '']);
    const suffix = random.chance(0.6) ? String(random.int(1, 99)) : '';
    const email =
      `${first}${separator}${last}${suffix}@${random.pick(EMAIL_DOMAINS)}`.toLowerCase();

    if (emails.has(email)) {
      continue;
    }

    emails.add(email);
    customers.push({ id: `cus_${random.string(14)}`, name: `${first} ${last}`, email });
  }

  return customers;
}

function createPaymentMethod(random: Random, currency: Currency): PaymentMethod {
  const type = random.weighted(currency === 'USD' ? USD_METHOD_WEIGHTS : OTHER_METHOD_WEIGHTS);
  const last4 = random.string(4, '0123456789');

  if (type === 'ach') {
    return {
      type,
      bankName: random.pick(BANK_NAMES),
      last4,
      accountType: random.chance(0.8) ? 'checking' : 'savings',
    };
  }

  const brand = random.weighted(BRAND_WEIGHTS);

  if (type === 'wallet') {
    return { type, wallet: random.weighted(WALLET_WEIGHTS), brand, last4 };
  }

  return {
    type,
    brand,
    last4,
    expMonth: random.int(1, 12),
    expYear: random.int(2027, 2031),
    funding: random.chance(0.7) ? 'credit' : 'debit',
    country: random.pick(CARD_COUNTRY[currency]),
  };
}

function createBlueprints(): readonly Blueprint[] {
  const random = createRandom(DATASET_SEED);
  const customers = createCustomers(random);
  const ids = new Set<string>();
  const blueprints: Blueprint[] = [];

  for (const band of AGE_BANDS) {
    for (let index = 0; index < band.count; index += 1) {
      let id = `pi_3${random.string(24)}`;

      while (ids.has(id)) {
        id = `pi_3${random.string(24)}`;
      }

      ids.add(id);

      const placement = band.place(random);
      const ageDays = placementAgeDays(placement);
      const currency = random.weighted(CURRENCY_WEIGHTS);
      const paymentMethod = createPaymentMethod(random, currency);
      const drawn = random.weighted(statusWeights(ageDays));
      // Bank debits aren't canceled after authorization or blocked by card fraud rules.
      const status =
        paymentMethod.type === 'ach' && (drawn === 'canceled' || drawn === 'blocked')
          ? 'failed'
          : drawn;
      const description = random.weighted(DESCRIPTION_WEIGHTS);
      const disputed = status === 'succeeded' && ageDays >= 3 && random.chance(0.05);

      const metadata: Record<string, string> =
        description === 'Payment for Invoice'
          ? {
              invoice_id: `in_${random.string(14)}`,
              order_reference: `ORD-${random.int(10000, 99999)}`,
            }
          : { subscription_id: `sub_${random.string(14)}`, plan: random.pick(PLANS) };

      blueprints.push({
        id,
        placement,
        amountMinor: random.weighted(PRICES[currency]),
        currency,
        status,
        captured: status !== 'pending' || paymentMethod.type === 'ach',
        description,
        paymentMethod,
        customer: random.pick(customers),
        declineReason: status === 'failed' ? random.weighted(DECLINE_WEIGHTS) : null,
        refundDelay: status === 'refunded' ? 0.05 + random.next() * 0.9 : null,
        disputeDelay: disputed ? 0.1 + random.next() * 0.8 : null,
        metadata,
      });
    }
  }

  return blueprints;
}

let cachedBlueprints: readonly Blueprint[] | null = null;

function getBlueprints(): readonly Blueprint[] {
  cachedBlueprints ??= createBlueprints();

  return cachedBlueprints;
}

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const MAX_REFUND_DELAY_MS = 10 * DAY_MS;
const MAX_DISPUTE_DELAY_MS = 30 * DAY_MS;

/**
 * Live payments sit a few minutes before the current hour, so they stay put
 * for the whole hour. In the first hour of the day that would be yesterday,
 * so they move to the first seconds of today instead.
 */
function livePaymentInstant(
  placement: Extract<Placement, { kind: 'live' }>,
  currentHour: number,
  startOfToday: number,
): number {
  const candidate = currentHour - placement.minutesBeforeHour * MINUTE_MS - placement.second * 1000;

  return candidate >= startOfToday ? candidate : startOfToday + (placement.second % 30) * 1000;
}

/**
 * Picks a date after `createdAtMs` for a refund or dispute: `fraction` of the
 * time between the payment and the start of today, capped at `maxDelayMs`.
 * Returns null when there is no such event or the payment is from today.
 */
function eventAfterPayment(
  createdAtMs: number,
  startOfToday: number,
  fraction: number | null,
  { minDelayMs, maxDelayMs }: { minDelayMs: number; maxDelayMs: number },
): number | null {
  const timeBeforeToday = startOfToday - createdAtMs;

  if (fraction === null || timeBeforeToday <= 0) {
    return null;
  }

  return (
    createdAtMs + Math.max(minDelayMs, Math.floor(Math.min(timeBeforeToday, maxDelayMs) * fraction))
  );
}

function toIsoOrNull(instant: number | null): string | null {
  return instant === null ? null : new Date(instant).toISOString();
}

/** All payments created up to `now`, newest first. */
export function generateTransactions(
  now: number,
  timeZone: string = APP_TIME_ZONE,
): readonly Transaction[] {
  const today = toCalendarDate(now, timeZone);
  const startOfToday = startOfZonedDay(today, timeZone);
  const currentHour = now - (now % HOUR_MS);
  const dayStarts = new Map<number, number>();

  const startOfDayOffset = (dayOffset: number): number => {
    let start = dayStarts.get(dayOffset);

    if (start === undefined) {
      start = startOfZonedDay(addCalendarDays(today, -dayOffset), timeZone);
      dayStarts.set(dayOffset, start);
    }

    return start;
  };

  const transactions: Transaction[] = [];

  for (const blueprint of getBlueprints()) {
    const { placement } = blueprint;
    const createdAtMs =
      placement.kind === 'live'
        ? livePaymentInstant(placement, currentHour, startOfToday)
        : startOfDayOffset(placement.dayOffset) +
          placement.minuteOfDay * MINUTE_MS +
          placement.second * 1000;

    if (createdAtMs > now) {
      continue;
    }

    const refundedAt = eventAfterPayment(createdAtMs, startOfToday, blueprint.refundDelay, {
      minDelayMs: MINUTE_MS,
      maxDelayMs: MAX_REFUND_DELAY_MS,
    });
    const disputedAt = eventAfterPayment(createdAtMs, startOfToday, blueprint.disputeDelay, {
      minDelayMs: HOUR_MS,
      maxDelayMs: MAX_DISPUTE_DELAY_MS,
    });

    transactions.push({
      id: blueprint.id,
      amountMinor: blueprint.amountMinor,
      currency: blueprint.currency,
      // statusWeights never refunds a payment from today, so refunded ones
      // always have a refund date.
      status: blueprint.status,
      captured: blueprint.captured,
      description: blueprint.description,
      paymentMethod: blueprint.paymentMethod,
      customer: blueprint.customer,
      createdAt: new Date(createdAtMs).toISOString(),
      refundedAt: toIsoOrNull(refundedAt),
      declineReason: blueprint.declineReason,
      disputedAt: toIsoOrNull(disputedAt),
      metadata: blueprint.metadata,
    });
  }

  return transactions.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id),
  );
}
