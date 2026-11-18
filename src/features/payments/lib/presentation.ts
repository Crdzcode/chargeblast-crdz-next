import type {
  CardBrand,
  Currency,
  DeclineReason,
  PaymentMethod,
  PaymentMethodType,
  PaymentStatus,
  WalletProvider,
} from '../model/transaction';

export const STATUS_LABELS: Record<PaymentStatus, string> = {
  succeeded: 'Succeeded',
  pending: 'Pending',
  failed: 'Failed',
  refunded: 'Refunded',
};

export const PAYMENT_METHOD_TYPE_LABELS: Record<PaymentMethodType, string> = {
  card: 'Card',
  ach: 'ACH',
  wallet: 'Wallet',
};

export const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
};

export const WALLET_LABELS: Record<WalletProvider, string> = {
  link: 'Link',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: 'USD — US dollar',
  BRL: 'BRL — Brazilian real',
  EUR: 'EUR — Euro',
  GBP: 'GBP — British pound',
};

export const DECLINE_REASON_LABELS: Record<DeclineReason, string> = {
  insufficient_funds: 'Insufficient funds',
  do_not_honor: 'Do not honor',
  transaction_not_allowed: 'Transaction not allowed',
  incorrect_cvc: 'Incorrect CVC',
  expired_card: 'Expired card',
  processing_error: 'Processing error',
};

/**
 * Human-readable payment method used for accessible names and CSV, e.g.
 * "Apple Pay with Visa ending in 6745" or "Chase checking (ACH) ending in 1821".
 */
export function describePaymentMethod(method: PaymentMethod): string {
  const ending = `ending in ${method.last4}`;

  switch (method.type) {
    case 'ach':
      return `${method.bankName} ${method.accountType} (ACH) ${ending}`;
    case 'wallet':
      return `${WALLET_LABELS[method.wallet]} with ${CARD_BRAND_LABELS[method.brand]} ${ending}`;
    case 'card':
      return `${CARD_BRAND_LABELS[method.brand]} ${ending}`;
  }
}

/**
 * Visual abbreviation of a payment id: keeps the prefix and the last
 * characters, e.g. "pi_3QxYz8LkdIwHu7ix0bA1cD2E" → "pi_3QxY…cD2E".
 * The full value stays available through the tooltip and the copy button.
 */
export function shortenPaymentId(id: string, head = 8, tail = 4): string {
  if (id.length <= head + tail + 1) {
    return id;
  }

  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}
