'use client';

import { useCallback, useMemo } from 'react';

import { useStoredString, writeStorage } from '@/lib/browser-storage';

import {
  SAVED_FILTERS_STORAGE_KEY,
  parseSavedFilters,
  serializeSavedFilters,
  toSavedParams,
  upsertSavedFilter,
  type SavedFilter,
} from '../lib/saved-filters';
import type { PaymentsQuery } from '../model/query';

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `filter_${crypto.randomUUID()}`
    : `filter_${Date.now().toString(36)}`;
}

/** Named saved filters persisted in localStorage (this browser only). */
export function useSavedFilters() {
  const raw = useStoredString(SAVED_FILTERS_STORAGE_KEY);
  const filters = useMemo(() => parseSavedFilters(raw), [raw]);

  const persist = useCallback((items: readonly SavedFilter[]) => {
    writeStorage(SAVED_FILTERS_STORAGE_KEY, serializeSavedFilters(items));
  }, []);

  /** Saves the query under `name`, replacing `replaceId` when given. */
  const save = useCallback(
    (name: string, query: PaymentsQuery, replaceId?: string): SavedFilter => {
      const now = new Date().toISOString();
      const existing = replaceId ? filters.find((filter) => filter.id === replaceId) : undefined;
      const saved: SavedFilter = {
        id: existing?.id ?? createId(),
        name: name.trim(),
        params: toSavedParams(query),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      persist(upsertSavedFilter(filters, saved));

      return saved;
    },
    [filters, persist],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      const target = filters.find((filter) => filter.id === id);

      if (trimmed !== '' && target) {
        persist(
          upsertSavedFilter(filters, {
            ...target,
            name: trimmed,
            updatedAt: new Date().toISOString(),
          }),
        );
      }
    },
    [filters, persist],
  );

  const remove = useCallback(
    (id: string) => persist(filters.filter((filter) => filter.id !== id)),
    [filters, persist],
  );

  return { filters, save, rename, remove };
}
