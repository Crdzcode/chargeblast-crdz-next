'use client';

import { Check, ChevronDown, Copy, LogOut, Settings, UserPlus } from 'lucide-react';
import { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UNAVAILABLE_MESSAGE } from '@/components/ui/unavailable';
import { copyText } from '@/lib/clipboard';

export const ACCOUNT = {
  name: 'cramly.ai',
  id: 'acct_1QxDemoCramlyAi',
} as const;

function AccountLogo({ size = 22 }: { size?: number }) {
  return (
    // Placeholder logo: a lavender tile with a handwritten wordmark.
    <svg
      viewBox="0 0 22 22"
      width={size}
      height={size}
      aria-hidden
      focusable="false"
      className="shrink-0"
    >
      <rect width="22" height="22" rx="5" className="fill-account-logo" />
      <text
        x="11"
        y="12.6"
        textAnchor="middle"
        fontFamily="'Segoe Script', 'Brush Script MT', 'Snell Roundhand', cursive"
        fontSize="5.2"
        fontStyle="italic"
        className="fill-fg"
      >
        Cramly
      </text>
    </svg>
  );
}

/**
 * Account switcher at the top of the sidebar. Copying the account ID works; the
 * other actions are out of scope.
 */
export function AccountMenu() {
  const [copied, setCopied] = useState(false);

  return (
    <DropdownMenu onOpenChange={() => setCopied(false)}>
      <DropdownMenuTrigger className="flex h-9 w-full items-center gap-2 rounded-control px-2 text-left hover:bg-nav-active data-[state=open]:bg-nav-active">
        <AccountLogo />
        <span className="flex-1 truncate text-[15px] font-semibold">{ACCOUNT.name}</span>
        <ChevronDown className="size-4 text-fg-muted" aria-hidden />
        <span className="sr-only">Open account menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <AccountLogo size={32} />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold">{ACCOUNT.name}</p>
            <p className="truncate text-[12px] text-fg-muted">{ACCOUNT.id}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void copyText(ACCOUNT.id).then(setCopied);
          }}
        >
          {copied ? (
            <Check className="size-4 text-success-icon" aria-hidden />
          ) : (
            <Copy className="size-4 text-fg-muted" aria-hidden />
          )}
          {copied ? 'Account ID copied' : 'Copy account ID'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{UNAVAILABLE_MESSAGE}</DropdownMenuLabel>
        <DropdownMenuItem disabled>
          <Settings className="size-4" aria-hidden />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <UserPlus className="size-4" aria-hidden />
          Switch account
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
