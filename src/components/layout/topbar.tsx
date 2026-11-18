'use client';

import { Bell, CircleHelp, LayoutGrid, Menu, Plus, Settings, X } from 'lucide-react';
import { Dialog } from 'radix-ui';

import { Unavailable } from '@/components/ui/unavailable';

import { GlobalSearch } from './global-search';
import { SidebarContent } from './sidebar';

function IconButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Unavailable>
      <button
        type="button"
        aria-label={label}
        aria-disabled="true"
        className="relative inline-flex size-8 items-center justify-center rounded-full text-fg-secondary hover:bg-surface-hover hover:text-fg"
      >
        {children}
      </button>
    </Unavailable>
  );
}

function MobileNavigation() {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label="Open navigation"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-control text-fg hover:bg-surface-hover lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/20" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[260px] bg-canvas shadow-popover outline-none">
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <Dialog.Description className="sr-only">Dashboard sections</Dialog.Description>
          <Dialog.Close
            aria-label="Close navigation"
            className="absolute top-3.5 right-2 inline-flex size-7 items-center justify-center rounded-control hover:bg-surface-hover"
          >
            <X className="size-4" aria-hidden />
          </Dialog.Close>
          <SidebarContent />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Top bar: global search, the test-mode notice, app shortcuts and account actions. */
export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 bg-canvas px-4 md:px-10">
      <MobileNavigation />
      <GlobalSearch />
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <p className="hidden text-[15px] text-fg xl:block">
          Test mode has moved.{' '}
          <Unavailable>
            <button type="button" aria-disabled="true" className="underline underline-offset-2">
              Show me
            </button>
          </Unavailable>
        </p>
        <Unavailable>
          <button
            type="button"
            aria-label="Apps"
            aria-disabled="true"
            className="ml-2 hidden h-8 items-center gap-2 rounded-full border border-line px-2.5 md:inline-flex"
          >
            <span aria-hidden className="size-4 rounded-[4px] bg-[#0a0a0a]" />
            <span aria-hidden className="size-4 rounded-[4px] bg-[#3b9cf1]" />
            <span aria-hidden className="size-4 rounded-[4px] bg-[#16a34a]" />
            <LayoutGrid className="size-4 text-fg-secondary" aria-hidden />
          </button>
        </Unavailable>
        <IconButton label="Help">
          <CircleHelp className="size-[18px]" aria-hidden />
        </IconButton>
        <IconButton label="Notifications">
          <Bell className="size-[18px]" aria-hidden />
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary"
          />
        </IconButton>
        <IconButton label="Settings">
          <Settings className="size-[18px]" aria-hidden />
        </IconButton>
        <Unavailable>
          <button
            type="button"
            aria-label="Create"
            aria-disabled="true"
            className="inline-flex size-[26px] items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover"
          >
            <Plus className="size-4" strokeWidth={2.5} aria-hidden />
          </button>
        </Unavailable>
      </div>
    </header>
  );
}
