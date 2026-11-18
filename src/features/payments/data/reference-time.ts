import 'server-only';

import { connection } from 'next/server';

/**
 * The reference instant for the mock dataset, read once per request.
 *
 * `connection()` keeps it out of prerendering, so the deployed app never
 * serves a dataset frozen at build time. `PAYMENTS_REFERENCE_TIME` (an ISO
 * instant) pins the clock for reproducible screenshots and E2E runs.
 */
export async function getReferenceTime(): Promise<number> {
  await connection();

  const pinned = process.env.PAYMENTS_REFERENCE_TIME;
  const parsed = pinned ? Date.parse(pinned) : Number.NaN;

  return Number.isNaN(parsed) ? Date.now() : parsed;
}
