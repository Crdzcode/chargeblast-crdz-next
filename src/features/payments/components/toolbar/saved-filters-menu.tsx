'use client';

import { Bookmark, Check, Link2, Pencil, Trash2 } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { useCopyFeedback, type CopyState } from '@/components/ui/copy-button';
import { inputStyles } from '@/components/ui/input-styles';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

import { useSavedFilters } from '../../hooks/use-saved-filters';
import {
  findSavedFilterByName,
  savedFilterToQuery,
  type SavedFilter,
} from '../../lib/saved-filters';
import { hasActiveFilters, type PaymentsQuery } from '../../model/query';

const inputClass = cn(inputStyles, 'min-w-0 flex-1');

interface SavedFiltersMenuProps {
  readonly query: PaymentsQuery;
  readonly onApply: (query: PaymentsQuery) => void;
}

/**
 * Filters saved in this browser, plus a button that copies a link to the
 * current view. The Stripe screen has no such button in its default state, so
 * it stays hidden until there is a filter to save or a saved one to apply.
 *
 * The popover content unmounts when it closes, which resets the forms inside.
 */
export function SavedFiltersMenu({ query, onApply }: SavedFiltersMenuProps) {
  const { filters, save, rename, remove } = useSavedFilters();
  const [open, setOpen] = useState(false);

  if (!open && filters.length === 0 && !hasActiveFilters(query)) {
    return null;
  }

  const applyFilter = (filter: SavedFilter) => {
    onApply(savedFilterToQuery(filter));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
                <SavedFilterRow
                  key={filter.id}
                  filter={filter}
                  onApply={() => applyFilter(filter)}
                  onRename={(name) => rename(filter.id, name)}
                  onDelete={() => remove(filter.id)}
                />
              ))}
            </ul>
          )}
        </div>
        <SaveFilterForm
          filters={filters}
          onSave={(name, replaceId) => save(name, query, replaceId)}
        />
        <div className="border-t border-line p-2">
          <CopyViewLinkButton />
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface SavedFilterRowProps {
  readonly filter: SavedFilter;
  readonly onApply: () => void;
  readonly onRename: (name: string) => void;
  readonly onDelete: () => void;
}

/** Renames inline. Deleting takes a second click on "Delete?". */
function SavedFilterRow({ filter, onApply, onRename, onDelete }: SavedFilterRowProps) {
  const [renameDraft, setRenameDraft] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (renameDraft !== null) {
    return (
      <li className="flex h-8 items-center gap-1 rounded-control pl-2 hover:bg-surface">
        <form
          className="flex flex-1 items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            onRename(renameDraft);
            setRenameDraft(null);
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
      </li>
    );
  }

  return (
    <li className="flex h-8 items-center gap-1 rounded-control pl-2 hover:bg-surface">
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left text-[14px]"
        aria-label={`Apply saved filter ${filter.name}`}
        onClick={onApply}
      >
        {filter.name}
      </button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Rename ${filter.name}`}
        onClick={() => setRenameDraft(filter.name)}
      >
        <Pencil className="size-3.5" aria-hidden />
      </Button>
      {confirmingDelete ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-danger-fg"
          aria-label={`Confirm deleting ${filter.name}`}
          onClick={onDelete}
        >
          <span className="text-[12px]">Delete?</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="hover:text-danger-fg"
          aria-label={`Delete ${filter.name}`}
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      )}
    </li>
  );
}

interface SaveFilterFormProps {
  readonly filters: readonly SavedFilter[];
  readonly onSave: (name: string, replaceId?: string) => void;
}

/** Saving under an existing name asks once, then replaces that filter. */
function SaveFilterForm({ filters, onSave }: SaveFilterFormProps) {
  const inputId = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState<SavedFilter | null>(null);

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

    onSave(trimmed, duplicate?.id);
    setName('');
    setReplacing(null);
    setError(null);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5 border-t border-line px-4 py-3">
      <label htmlFor={inputId} className="text-[12px] font-semibold text-fg-secondary">
        Save current filters as
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
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
  );
}

const LINK_LABELS: Record<CopyState, string> = {
  idle: 'Copy link to this view',
  copied: 'Link copied',
  failed: 'Could not copy link',
};

function CopyViewLinkButton() {
  const { state, copy } = useCopyFeedback();
  const Icon = state === 'copied' ? Check : Link2;

  return (
    <>
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => void copy(window.location.href)}
      >
        <Icon className={cn('size-3.5', state === 'copied' && 'text-success-icon')} aria-hidden />
        {LINK_LABELS[state]}
      </Button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied' ? 'Link copied to clipboard' : ''}
      </span>
    </>
  );
}
