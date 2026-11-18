import type { PaymentsQuery } from '../model/query';
import { parsePaymentsQuery, serializePaymentsQuery } from './query-url';

/**
 * A saved filter stores the query as a URL query string, so the same parser
 * restores links and saved filters. The page number isn't saved, and neither
 * are column settings or selection.
 */
export interface SavedFilter {
  readonly id: string;
  readonly name: string;
  /** URL query string without the leading "?" (page excluded). */
  readonly params: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export const SAVED_FILTERS_STORAGE_KEY = 'payments-saved-filters-v1';

interface SavedFiltersStorage {
  readonly version: 1;
  readonly items: readonly SavedFilter[];
}

export function toSavedParams(query: PaymentsQuery): string {
  const params = serializePaymentsQuery({ ...query, page: 1 });

  return params.toString();
}

export function savedFilterToQuery(filter: SavedFilter): PaymentsQuery {
  return parsePaymentsQuery(new URLSearchParams(filter.params));
}

function isSavedFilter(value: unknown): value is SavedFilter {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate['id'] === 'string' &&
    typeof candidate['name'] === 'string' &&
    candidate['name'].trim() !== '' &&
    typeof candidate['params'] === 'string' &&
    typeof candidate['createdAt'] === 'string' &&
    typeof candidate['updatedAt'] === 'string'
  );
}

export function sortSavedFilters(items: readonly SavedFilter[]): readonly SavedFilter[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

/** Skips anything malformed or from an older version instead of throwing. */
export function parseSavedFilters(raw: string | null): readonly SavedFilter[] {
  if (raw === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SavedFiltersStorage>;

    if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
      return [];
    }

    return sortSavedFilters(parsed.items.filter(isSavedFilter));
  } catch {
    return [];
  }
}

export function serializeSavedFilters(items: readonly SavedFilter[]): string {
  const storage: SavedFiltersStorage = { version: 1, items };

  return JSON.stringify(storage);
}

export function findSavedFilterByName(
  items: readonly SavedFilter[],
  name: string,
): SavedFilter | undefined {
  const normalized = name.trim().toLowerCase();

  return items.find((item) => item.name.trim().toLowerCase() === normalized);
}

/** Inserts or replaces (by id) a saved filter and keeps the list sorted. */
export function upsertSavedFilter(
  items: readonly SavedFilter[],
  filter: SavedFilter,
): readonly SavedFilter[] {
  return sortSavedFilters([...items.filter((item) => item.id !== filter.id), filter]);
}
