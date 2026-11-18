'use client';

import { useCallback, useMemo } from 'react';

import { useStoredString, writeStorage } from '@/lib/browser-storage';

import {
  mergeColumnPreferences,
  type ColumnConfig,
  type StoredColumnPreference,
} from '../model/columns';

export const COLUMN_PREFERENCES_KEY = 'payments-column-preferences-v1';

export function parseColumnPreferences(raw: string | null): readonly ColumnConfig[] {
  if (raw === null) {
    return mergeColumnPreferences([]);
  }

  try {
    const parsed = JSON.parse(raw) as { version?: unknown; columns?: unknown };

    if (parsed.version !== 1 || !Array.isArray(parsed.columns)) {
      return mergeColumnPreferences([]);
    }

    return mergeColumnPreferences(
      (parsed.columns as unknown[]).filter(
        (entry): entry is StoredColumnPreference =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as { id?: unknown }).id === 'string',
      ),
    );
  } catch {
    return mergeColumnPreferences([]);
  }
}

/**
 * Column visibility, order and width persisted per browser. These are view
 * preferences: never part of the URL nor of saved filters.
 */
export function useColumnPreferences() {
  const raw = useStoredString(COLUMN_PREFERENCES_KEY);
  const columns = useMemo(() => parseColumnPreferences(raw), [raw]);

  const saveColumns = useCallback((next: readonly ColumnConfig[]) => {
    writeStorage(
      COLUMN_PREFERENCES_KEY,
      JSON.stringify({
        version: 1,
        columns: next.map(({ id, visible, order, width }) => ({ id, visible, order, width })),
      }),
    );
  }, []);

  const resetColumns = useCallback(() => writeStorage(COLUMN_PREFERENCES_KEY, null), []);

  return { columns, saveColumns, resetColumns };
}
