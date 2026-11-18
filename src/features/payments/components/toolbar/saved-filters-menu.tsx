'use client';

import { Bookmark, Check, Link2, Pencil, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { copyText } from '@/lib/clipboard';

import { useSavedFilters } from '../../hooks/use-saved-filters';
import {
  findSavedFilterByName,
  savedFilterToQuery,
  type SavedFilter,
} from '../../lib/saved-filters';
import type { PaymentsQuery } from '../../model/query';

const inputClass =
  'h-7 min-w-0 flex-1 rounded-control border border-line-strong bg-canvas px-2 text-[14px] shadow-control placeholder:text-fg-disabled focus-visible:border-primary';

/**
 * Named filters stored in this browser plus "Copy link" for sharing the
 * current view (the URL already carries every filter).
 */
export function SavedFiltersMenu({
  query,
  onApply,
}: {
  readonly query: PaymentsQuery;
  readonly onApply: (query: PaymentsQuery) => void;
}) {
  const { filters, save, rename, remove } = useSavedFilters();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState<SavedFilter | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [linkState, setLinkState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const reset = () => {
    setName('');
    setError(null);
    setReplacing(null);
    setRenamingId(null);
    setConfirmDeleteId(null);
    setLinkState('idle');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();

    if (trimmed === '') {
      setError('Enter a name for this filter.');
      return;
    }

    const duplicate = findSavedFilterByName(filters, trimmed);

    if (duplicate && replacing?.id !== duplicate.id) {
      setReplacing(duplicate);
      setError(null);
      return;
    }

    save(trimmed, query, duplicate?.id);
    setName('');
    setReplacing(null);
    setError(null);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Tooltip content="Saved filters">
        <PopoverTrigger asChild>
          <Button size="icon" aria-label="Saved filters">
            <Bookmark className="size-3.5" aria-hidden />
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent align="end" className="w-[320px]">
        <p className="border-b border-line px-4 pt-3 pb-2.5 text-[14px] font-semibold">
          Saved filters
        </p>
        <div className="p-2">
          {filters.length === 0 ? (
            <p className="rounded-control bg-surface px-3 py-2.5 text-[13px] text-fg-secondary">
              No saved filters yet. Set up filters, then save them below.
            </p>
          ) : (
            <ul
              className="flex max-h-56 flex-col gap-0.5 overflow-y-auto"
              aria-label="Saved filters"
            >
              {filters.map((filter) => (
                <li
                  key={filter.id}
                  className="flex h-8 items-center gap-1 rounded-control pl-2 hover:bg-surface"
                >
                  {renamingId === filter.id ? (
                    <form
                      className="flex flex-1 items-center gap-1"
                      onSubmit={(event) => {
                        event.preventDefault();
                        rename(filter.id, renameDraft);
                        setRenamingId(null);
                      }}
                    >
                      <input
                        autoFocus
                        aria-label="New filter name"
                        value={renameDraft}
                        onChange={(event) => setRenameDraft(event.target.value)}
                        className={inputClass}
                      />
                      <Button type="submit" variant="ghost" size="icon" aria-label="Confirm rename">
                        <Check className="size-3.5 text-success-icon" aria-hidden />
                      </Button>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-[14px]"
                        aria-label={`Apply saved filter ${filter.name}`}
                        onClick={() => {
                          onApply(savedFilterToQuery(filter));
                          setOpen(false);
                          reset();
                        }}
                      >
                        {filter.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Rename ${filter.name}`}
                        onClick={() => {
                          setRenamingId(filter.id);
                          setRenameDraft(filter.name);
                        }}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size={confirmDeleteId === filter.id ? 'sm' : 'icon'}
                        className={
                          confirmDeleteId === filter.id ? 'text-danger-fg' : 'hover:text-danger-fg'
                        }
                        aria-label={
                          confirmDeleteId === filter.id
                            ? `Confirm deleting ${filter.name}`
                            : `Delete ${filter.name}`
                        }
                        onClick={() => {
                          if (confirmDeleteId === filter.id) {
                            remove(filter.id);
                            setConfirmDeleteId(null);
                          } else {
                            setConfirmDeleteId(filter.id);
                          }
                        }}
                      >
                        {confirmDeleteId === filter.id ? (
                          <span className="text-[12px]">Delete?</span>
                        ) : (
                          <Trash2 className="size-3.5" aria-hidden />
                        )}
                      </Button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <form onSubmit={submit} className="flex flex-col gap-1.5 border-t border-line px-4 py-3">
          <label
            htmlFor="saved-filter-name"
            className="text-[12px] font-semibold text-fg-secondary"
          >
            Save current filters as
          </label>
          <div className="flex gap-2">
            <input
              id="saved-filter-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setReplacing(null);
                setError(null);
              }}
              placeholder="e.g. Failed cards this week"
              className={inputClass}
            />
            <Button type="submit" variant="primary">
              {replacing ? 'Replace' : 'Save'}
            </Button>
          </div>
          {error ? (
            <p role="alert" className="text-[12px] text-danger-fg">
              {error}
            </p>
          ) : null}
          {replacing ? (
            <p className="text-[12px] text-warning-fg" role="status">
              “{replacing.name}” already exists. Select Replace to overwrite it.
            </p>
          ) : null}
        </form>
        <div className="border-t border-line p-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={async () => {
              setLinkState((await copyText(window.location.href)) ? 'copied' : 'failed');
            }}
          >
            {linkState === 'copied' ? (
              <Check className="size-3.5 text-success-icon" aria-hidden />
            ) : (
              <Link2 className="size-3.5" aria-hidden />
            )}
            {linkState === 'copied'
              ? 'Link copied'
              : linkState === 'failed'
                ? 'Could not copy link'
                : 'Copy link to this view'}
          </Button>
          <span className="sr-only" aria-live="polite">
            {linkState === 'copied' ? 'Link copied to clipboard' : ''}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
