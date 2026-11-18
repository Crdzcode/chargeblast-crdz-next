import type {
  CardBrand,
  Currency,
  DeclineReason,
  PaymentMethodType,
  PaymentStatus,
  WalletProvider,
} from '../model/transaction';

/**
 * The raw material for the mock dataset: names, prices and how often each
 * value shows up. Weights are relative, they don't need to add up to 100.
 */

type Weighted<T> = readonly (readonly [T, number])[];

export const FIRST_NAMES = [
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

export const LAST_NAMES = [
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
export const EMAIL_DOMAINS = ['example.com', 'example.org', 'example.net'] as const;

/** Amounts in minor units, weighted by how common each price is. */
export const PRICES: Record<Currency, Weighted<number>> = {
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

export const CARD_COUNTRY: Record<Currency, readonly string[]> = {
  USD: ['US'],
  BRL: ['BR'],
  EUR: ['DE', 'FR', 'ES', 'IT', 'NL'],
  GBP: ['GB'],
};

export const BANK_NAMES = [
  'Chase',
  'Bank of America',
  'Wells Fargo',
  'Citibank',
  'Capital One',
  'US Bank',
  'PNC Bank',
  'Truist',
] as const;

export const BRAND_WEIGHTS: Weighted<CardBrand> = [
  ['visa', 55],
  ['mastercard', 25],
  ['amex', 12],
  ['discover', 8],
];

export const WALLET_WEIGHTS: Weighted<WalletProvider> = [
  ['link', 40],
  ['apple_pay', 35],
  ['google_pay', 25],
];

export const DECLINE_WEIGHTS: Weighted<DeclineReason> = [
  ['insufficient_funds', 34],
  ['do_not_honor', 26],
  ['transaction_not_allowed', 14],
  ['incorrect_cvc', 10],
  ['expired_card', 10],
  ['processing_error', 6],
];

export const PLANS = ['starter_monthly', 'pro_monthly', 'pro_annual', 'team_monthly'] as const;

export const CURRENCY_WEIGHTS: Weighted<Currency> = [
  ['USD', 50],
  ['BRL', 20],
  ['EUR', 15],
  ['GBP', 15],
];

/** ACH is a US bank debit, so only USD payments use it. */
export const USD_METHOD_WEIGHTS: Weighted<PaymentMethodType> = [
  ['card', 60],
  ['wallet', 20],
  ['ach', 20],
];

export const OTHER_METHOD_WEIGHTS: Weighted<PaymentMethodType> = [
  ['card', 72],
  ['wallet', 28],
];

export type PaymentDescription =
  'Subscription update' | 'Subscription creation' | 'Payment for Invoice';

export const DESCRIPTION_WEIGHTS: Weighted<PaymentDescription> = [
  ['Subscription update', 64],
  ['Subscription creation', 22],
  ['Payment for Invoice', 14],
];

export function statusWeights(ageDays: number): Weighted<PaymentStatus> {
  if (ageDays === 0) {
    // Refunds take time, so nothing created today is refunded yet.
    return [
      ['succeeded', 58],
      ['failed', 14],
      ['pending', 20],
      ['canceled', 4],
      ['blocked', 4],
    ];
  }

  if (ageDays <= 6) {
    return [
      ['succeeded', 55],
      ['failed', 13],
      ['pending', 14],
      ['refunded', 11],
      ['canceled', 4],
      ['blocked', 3],
    ];
  }

  // Older pending payments are rare: ACH debits that are still processing.
  return [
    ['succeeded', 63],
    ['failed', 13],
    ['pending', 3],
    ['refunded', 15],
    ['canceled', 3],
    ['blocked', 3],
  ];
}
