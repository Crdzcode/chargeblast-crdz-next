import { describe, expect, it } from 'vitest';

import {
  findSavedFilterByName,
  parseSavedFilters,
  savedFilterToQuery,
  serializeSavedFilters,
  toSavedParams,
  upsertSavedFilter,
  type SavedFilter,
} from '../lib/saved-filters';
import { DEFAULT_PAYMENTS_QUERY } from '../model/query';

describe('saved filters', () => {
  const filter: SavedFilter = {
    id: 'f1',
    name: 'Failed this week',
    params: toSavedParams({
      ...DEFAULT_PAYMENTS_QUERY,
      view: 'failed',
      date: { preset: '7d' },
      page: 4,
    }),
    createdAt: '2026-11-18T00:00:00.000Z',
    updatedAt: '2026-11-18T00:00:00.000Z',
  };

  it('stores the query without the page and restores it through the URL parser', () => {
    expect(filter.params).toBe('view=failed&datePreset=7d');
    expect(savedFilterToQuery(filter)).toEqual({
      ...DEFAULT_PAYMENTS_QUERY,
      view: 'failed',
      date: { preset: '7d' },
    });
  });

  it('round-trips storage and ignores invalid data', () => {
    expect(parseSavedFilters(serializeSavedFilters([filter]))).toEqual([filter]);
    expect(parseSavedFilters('{oops')).toEqual([]);
    expect(parseSavedFilters(JSON.stringify({ version: 0, items: [filter] }))).toEqual([]);
    expect(parseSavedFilters(JSON.stringify({ version: 1, items: [{ id: 1 }, filter] }))).toEqual([
      filter,
    ]);
  });

  it('finds names case-insensitively and upserts by id', () => {
    expect(findSavedFilterByName([filter], '  failed THIS week ')).toBe(filter);

    const renamed = { ...filter, name: 'A first' };
    expect(upsertSavedFilter([filter], renamed)).toEqual([renamed]);
  });
});
