'use client';

import { useSyncExternalStore } from 'react';

/**
 * localStorage that doesn't throw (private mode, full quota, storage turned
 * off) and tells subscribers about changes in this tab and others. Without
 * storage, values live in memory until the page reloads.
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
 * The stored string for `key`. On the server it is always null, so the first
 * client render matches the server HTML and the stored value shows up right
 * after hydration.
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
