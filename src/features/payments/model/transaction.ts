/** The four statuses from the brief, plus Canceled and Blocked, which Stripe shows too. */
export const PAYMENT_STATUSES = [
  'succeeded',
  'pending',
  'failed',
  'refunded',
  'canceled',
  'blocked',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Failed, canceled and blocked payments never moved money, so they can't be
 * selected for bulk actions.
 */
export function isSelectablePayment(transaction: { readonly status: PaymentStatus }): boolean {
  return (
    transaction.status !== 'failed' &&
    transaction.status !== 'canceled' &&
    transaction.status !== 'blocked'
  );
}

export const CURRENCIES = ['USD', 'BRL', 'EUR', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CARD_BRANDS = ['visa', 'mastercard', 'amex', 'discover'] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

export const WALLET_PROVIDERS = ['link', 'apple_pay', 'google_pay'] as const;
export type WalletProvider = (typeof WALLET_PROVIDERS)[number];

/** Top-level payment-method category used by the Payment method filter. */
export const PAYMENT_METHOD_TYPES = ['card', 'ach', 'wallet'] as const;
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export const DECLINE_REASONS = [
  'insufficient_funds',
  'do_not_honor',
  'transaction_not_allowed',
  'incorrect_cvc',
  'expired_card',
  'processing_error',
] as const;
export type DeclineReason = (typeof DECLINE_REASONS)[number];

export interface CardPaymentMethod {
  readonly type: 'card';
  readonly brand: CardBrand;
  readonly last4: string;
  readonly expMonth: number;
  readonly expYear: number;
  readonly funding: 'credit' | 'debit';
  readonly country: string;
}

/** A wallet always wraps an underlying card network. */
export interface WalletPaymentMethod {
  readonly type: 'wallet';
  readonly wallet: WalletProvider;
  readonly brand: CardBrand;
  readonly last4: string;
}

/** For ACH, last4 is the bank account ending. */
export interface AchPaymentMethod {
  readonly type: 'ach';
  readonly bankName: string;
  readonly last4: string;
  readonly accountType: 'checking' | 'savings';
}

export type PaymentMethod = CardPaymentMethod | WalletPaymentMethod | AchPaymentMethod;

export interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface Transaction {
  /** Stripe-style PaymentIntent id, e.g. `pi_3Q…`. */
  readonly id: string;
  /** Integer amount in the currency's minor unit (cents). */
  readonly amountMinor: number;
  readonly currency: Currency;
  readonly status: PaymentStatus;
  /**
   * False only for pending card/wallet authorizations that still await
   * capture ("Uncaptured" view). ACH debits are pending while processing.
   */
  readonly captured: boolean;
  readonly description: string;
  readonly paymentMethod: PaymentMethod;
  readonly customer: Customer;
  /** ISO-8601 UTC instant. */
  readonly createdAt: string;
  /** Present only for refunded payments; always after createdAt. */
  readonly refundedAt: string | null;
  /** Present only for failed payments. */
  readonly declineReason: DeclineReason | null;
  /** Present only for disputed (succeeded) payments; always after createdAt. */
  readonly disputedAt: string | null;
  readonly metadata: Readonly<Record<string, string>>;
}
