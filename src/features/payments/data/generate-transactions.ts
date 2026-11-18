import {
  APP_TIME_ZONE,
  DAY_MS,
  addCalendarDays,
  startOfZonedDay,
  toCalendarDate,
} from '@/lib/time-zone';

import type {
  CardBrand,
  Currency,
  Customer,
  DeclineReason,
  PaymentMethod,
  PaymentStatus,
  Transaction,
  WalletProvider,
} from '../model/transaction';
import { createRandom, type Random } from './random';

/**
 * Deterministic mock dataset that never goes stale.
 *
 * Every record is a fixed "blueprint" (id, customer, amount, status, method,
 * …) plus a position relative to the current day: `dayOffset` days before
 * today at a fixed minute of that day. Materializing the blueprints against
 * a reference instant therefore yields a daily snapshot: the same payment
 * keeps the same id and attributes, today's payments are always "today",
 * and the Today / 7 days / 30 days presets always have data.
 *
 * Rules:
 * - Nothing is ever created in the future: a today-blueprint whose minute
 *   has not happened yet is omitted until it does.
 * - A handful of "live" payments sit a few minutes before the current hour,
 *   so Today has rows even right after midnight.
 * - Refund and dispute dates are derived from the distance to the start of
 *   today, so they are stable for the whole day and never in the future.
 *
 * No `Math.random()` or implicit `new Date()`: the reference instant is
 * always passed in, which keeps server rendering, hydration and tests
 * reproducible.
 */

export const DATASET_SEED = 0x5eed_2026;
export const BLUEPRINT_COUNT = 1000;

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

/** How many blueprints land in each age band (sums to BLUEPRINT_COUNT). */
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

const FIRST_NAMES = [
  'James',
  'Laura',
  'Meredith',
  'Ava',
  'Beatriz',
  'Nathan',
  'Caleb',
  'Leo',
  'Ella',
  'Julia',
  'Felipe',
  'Valentina',
  'Sofia',
  'Lucas',
  'Isabela',
  'Mateus',
  'Olivia',
  'Noah',
  'Emma',
  'Liam',
  'Mia',
  'Ethan',
  'Grace',
  'Henry',
  'Chloe',
  'Daniel',
  'Hannah',
  'Samuel',
  'Amelia',
  'Gabriel',
  'Camila',
  'Rafael',
  'Ana',
  'Pedro',
  'Mariana',
  'Thomas',
  'Sophie',
  'Oliver',
  'Charlotte',
  'Jack',
] as const;

const LAST_NAMES = [
  'Lewis',
  'Rocha',
  'Wright',
  'King',
  'Williams',
  'Thompson',
  'Roberts',
  'Thomas',
  'Wilson',
  'Jackson',
  'Ribeiro',
  'Martin',
  'Santos',
  'Oliveira',
  'Souza',
  'Costa',
  'Brown',
  'Taylor',
  'Davies',
  'Evans',
  'Walker',
  'Hughes',
  'Green',
  'Hall',
  'Clarke',
  'Pereira',
  'Almeida',
  'Moreau',
  'Schmidt',
  'Fischer',
  'Garcia',
  'Lopez',
  'Martinez',
  'Rossi',
  'Bianchi',
  'Murphy',
  'Kelly',
] as const;

/** Reserved example domains (RFC 2606) so no real address is generated. */
const EMAIL_DOMAINS = ['example.com', 'example.org', 'example.net'] as const;

const CUSTOMER_COUNT = 320;

const PRICES: Record<Currency, readonly (readonly [number, number])[]> = {
  USD: [
    [407, 1],
    [499, 3],
    [888, 2],
    [899, 4],
    [988, 3],
    [999, 6],
    [1098, 6],
    [1099, 4],
    [1199, 6],
    [1318, 2],
    [1499, 5],
    [1538, 2],
    [1999, 8],
    [2093, 2],
    [2198, 6],
    [2499, 4],
    [2999, 4],
    [3499, 2],
    [4900, 2],
    [4999, 2],
    [7900, 1],
    [9999, 1],
    [14900, 1],
    [19900, 1],
    [49900, 0.4],
  ],
  BRL: [
    [990, 2],
    [1990, 4],
    [2990, 4],
    [4990, 4],
    [7990, 3],
    [9999, 5],
    [14990, 2],
    [18999, 3],
    [29990, 1],
    [49990, 0.5],
  ],
  EUR: [
    [499, 2],
    [899, 3],
    [1299, 4],
    [1999, 5],
    [2999, 3],
    [4900, 2],
    [9900, 1],
  ],
  GBP: [
    [499, 2],
    [999, 3],
    [1599, 5],
    [2499, 3],
    [3499, 3],
    [4999, 2],
    [9999, 1],
  ],
};

const CARD_COUNTRY: Record<Currency, readonly string[]> = {
  USD: ['US'],
  BRL: ['BR'],
  EUR: ['DE', 'FR', 'ES', 'IT', 'NL'],
  GBP: ['GB'],
};

const BANK_NAMES = [
  'Chase',
  'Bank of America',
  'Wells Fargo',
  'Citibank',
  'Capital One',
  'US Bank',
  'PNC Bank',
  'Truist',
] as const;

const BRAND_WEIGHTS: readonly (readonly [CardBrand, number])[] = [
  ['visa', 55],
  ['mastercard', 25],
  ['amex', 12],
  ['discover', 8],
];

const WALLET_WEIGHTS: readonly (readonly [WalletProvider, number])[] = [
  ['link', 40],
  ['apple_pay', 35],
  ['google_pay', 25],
];

const DECLINE_WEIGHTS: readonly (readonly [DeclineReason, number])[] = [
  ['insufficient_funds', 34],
  ['do_not_honor', 26],
  ['transaction_not_allowed', 14],
  ['incorrect_cvc', 10],
  ['expired_card', 10],
  ['processing_error', 6],
];

const PLANS = ['starter_monthly', 'pro_monthly', 'pro_annual', 'team_monthly'] as const;

function statusWeights(ageDays: number): readonly (readonly [PaymentStatus, number])[] {
  if (ageDays === 0) {
    // Refunds take time, so nothing created today is refunded yet.
    return [
      ['succeeded', 62],
      ['failed', 16],
      ['pending', 22],
    ];
  }

  if (ageDays <= 6) {
    return [
      ['succeeded', 58],
      ['failed', 15],
      ['pending', 15],
      ['refunded', 12],
    ];
  }

  // Older pending payments are rare: ACH debits that are still processing.
  return [
    ['succeeded', 66],
    ['failed', 15],
    ['pending', 3],
    ['refunded', 16],
  ];
}

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
  const type =
    currency === 'USD'
      ? random.weighted([
          ['card', 60],
          ['wallet', 20],
          ['ach', 20],
        ] as const)
      : random.weighted([
          ['card', 72],
          ['wallet', 28],
        ] as const);
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
      const currency = random.weighted([
        ['USD', 50],
        ['BRL', 20],
        ['EUR', 15],
        ['GBP', 15],
      ] as const);
      const paymentMethod = createPaymentMethod(random, currency);
      const status = random.weighted(statusWeights(ageDays));
      const description = random.weighted([
        ['Subscription update', 64],
        ['Subscription creation', 22],
        ['Payment for Invoice', 14],
      ] as const);
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
 * Live payments sit a few minutes before the current hour (stable for the
 * whole hour). During the first hour of the day that would fall on
 * yesterday, so they are pinned to the first seconds of today instead.
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
 * Materializes the dataset for a reference instant: newest first, only
 * payments created at or before `now`.
 */
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

    // Distance to the start of today is constant for a given blueprint
    // within a day, so these derived dates are stable all day long.
    const settledWindow = Math.max(startOfToday - createdAtMs, 0);
    const refundedAt =
      blueprint.refundDelay === null || settledWindow === 0
        ? null
        : createdAtMs +
          Math.max(
            MINUTE_MS,
            Math.floor(Math.min(settledWindow, MAX_REFUND_DELAY_MS) * blueprint.refundDelay),
          );
    const disputedAt =
      blueprint.disputeDelay === null || settledWindow === 0
        ? null
        : createdAtMs +
          Math.max(
            HOUR_MS,
            Math.floor(Math.min(settledWindow, MAX_DISPUTE_DELAY_MS) * blueprint.disputeDelay),
          );

    transactions.push({
      id: blueprint.id,
      amountMinor: blueprint.amountMinor,
      currency: blueprint.currency,
      // A refund needs a refund date; a refunded blueprint created "now"
      // (only possible for live rows) is reported as succeeded instead.
      status:
        blueprint.status === 'refunded' && refundedAt === null ? 'succeeded' : blueprint.status,
      captured: blueprint.captured,
      description: blueprint.description,
      paymentMethod: blueprint.paymentMethod,
      customer: blueprint.customer,
      createdAt: new Date(createdAtMs).toISOString(),
      refundedAt: refundedAt === null ? null : new Date(refundedAt).toISOString(),
      declineReason: blueprint.declineReason,
      disputedAt: disputedAt === null ? null : new Date(disputedAt).toISOString(),
      metadata: blueprint.metadata,
    });
  }

  return transactions.sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id),
  );
}
