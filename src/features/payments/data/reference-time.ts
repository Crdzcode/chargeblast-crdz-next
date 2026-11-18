import 'server-only';

import { connection } from 'next/server';

/**
 * The "now" for the mock data, read once per request.
 *
 * `connection()` keeps this out of prerendering, so a deployment never serves
 * data frozen at build time. Set PAYMENTS_REFERENCE_TIME to an ISO date to pin
 * it for screenshots and E2E runs.
 */
export async function getReferenceTime(): Promise<number> {
  await connection();

  const pinned = process.env.PAYMENTS_REFERENCE_TIME;
  const parsed = pinned ? Date.parse(pinned) : Number.NaN;

  return Number.isNaN(parsed) ? Date.now() : parsed;
}
