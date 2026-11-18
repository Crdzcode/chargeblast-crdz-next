'use client';

import { Bell, CircleHelp, Menu, Plus, Settings, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { Suspense, useState } from 'react';

import { Unavailable } from '@/components/ui/unavailable';
import { GlobalSearch } from '@/features/payments/components/global-search';

import { AppsDock } from './apps-dock';
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

function SearchFallback() {
  return <div className="h-[34px] w-full max-w-[552px] rounded-control bg-surface" aria-hidden />;
}

/** Below the lg breakpoint the sidebar becomes a drawer that slides in from the left. */
function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open navigation"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-fg transition-colors hover:bg-surface-hover active:bg-surface-pressed lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-[min(280px,85vw)] bg-canvas shadow-popover outline-none data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in">
          <Dialog.Title className="sr-only">Navigation</Dialog.Title>
          <Dialog.Description className="sr-only">Dashboard sections</Dialog.Description>
          <SidebarContent
            onNavigate={() => setOpen(false)}
            headerAction={
              <Dialog.Close
                aria-label="Close navigation"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-control text-fg-secondary transition-colors hover:bg-surface-hover hover:text-fg active:bg-surface-pressed"
              >
                <X className="size-4" aria-hidden />
              </Dialog.Close>
            }
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-[53px] items-center gap-3 bg-canvas px-4 md:px-10">
      <MobileNavigation />
      {/* useSearchParams needs a Suspense boundary; the fallback is an empty
          field of the same size. */}
      <Suspense fallback={<SearchFallback />}>
        <GlobalSearch />
      </Suspense>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <p className="hidden text-[14.5px] text-fg xl:block">
          Test mode has moved.{' '}
          <Unavailable>
            <button
              type="button"
              aria-disabled="true"
              className="ml-1 underline underline-offset-2"
            >
              Show me
            </button>
          </Unavailable>
        </p>
        <AppsDock />
        <IconButton label="Help">
          <CircleHelp className="size-[18px]" aria-hidden />
        </IconButton>
        <IconButton label="Notifications">
          <Bell className="size-[18px]" aria-hidden />
          <span
            aria-hidden
            className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-notification"
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
            className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover"
          >
            <Plus className="size-3.5" strokeWidth={2.75} aria-hidden />
          </button>
        </Unavailable>
      </div>
    </header>
  );
}
