import type { Route } from 'next';

export const PAYMENTS_PATH = '/transactions/payments';

export function paymentHref(id: string): Route {
  return `${PAYMENTS_PATH}/${id}` as Route;
}

export function paymentsSearchHref(term: string): Route {
  return `${PAYMENTS_PATH}?q=${encodeURIComponent(term)}` as Route;
}
