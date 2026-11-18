/** Small seeded PRNG (mulberry32) so the mock dataset is reproducible. */
export interface Random {
  /** Float in [0, 1). */
  next(): number;
  int(minInclusive: number, maxInclusive: number): number;
  pick<T>(values: readonly T[]): T;
  weighted<T>(entries: readonly (readonly [T, number])[]): T;
  chance(probability: number): boolean;
  string(length: number, alphabet?: string): string;
}

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function createRandom(seed: number): Random {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (minInclusive: number, maxInclusive: number): number =>
    minInclusive + Math.floor(next() * (maxInclusive - minInclusive + 1));

  const pick = <T>(values: readonly T[]): T => {
    const value = values[Math.floor(next() * values.length)];

    if (value === undefined) {
      throw new Error('Cannot pick from an empty list.');
    }

    return value;
  };

  const weighted = <T>(entries: readonly (readonly [T, number])[]): T => {
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = next() * total;

    for (const [value, weight] of entries) {
      roll -= weight;

      if (roll < 0) {
        return value;
      }
    }

    const last = entries[entries.length - 1];

    if (!last) {
      throw new Error('Cannot pick from an empty list.');
    }

    return last[0];
  };

  return {
    next,
    int,
    pick,
    weighted,
    chance: (probability) => next() < probability,
    string: (length, alphabet = BASE62) =>
      Array.from({ length }, () => alphabet[Math.floor(next() * alphabet.length)]).join(''),
  };
}
