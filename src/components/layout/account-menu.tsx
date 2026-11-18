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
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-[5px] bg-[#d9d4ff] text-[10px] font-bold text-primary-text"
      style={{ width: size, height: size }}
    >
      c
    </span>
  );
}

/**
 * Account switcher from the reference sidebar header. Account-level actions
 * are out of scope and say so; copying the account id works.
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
