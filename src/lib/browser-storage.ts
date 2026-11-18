'use client';

import { useSyncExternalStore } from 'react';

/**
 * localStorage wrapper that never throws (private mode, quota, disabled
 * storage) and notifies subscribers in the same tab and across tabs.
 * When storage is unavailable, values live in memory for the session.
 */
const memoryFallback = new Map<string, string | null>();
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function readStorage(key: string): string | null {
  if (memoryFallback.has(key)) {
    return memoryFallback.get(key) ?? null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, value);
    }

    memoryFallback.delete(key);
  } catch {
    memoryFallback.set(key, value);
  }

  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('storage', listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/**
 * Raw stored string for `key`. The server snapshot is always `null`, so the
 * first client render matches the server HTML and the stored value is
 * applied right after hydration (no hydration mismatch).
 */
export function useStoredString(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readStorage(key),
    () => null,
  );
}

/** Test helper: clears the in-memory fallback. */
export function resetStorageFallback(): void {
  memoryFallback.clear();
}
