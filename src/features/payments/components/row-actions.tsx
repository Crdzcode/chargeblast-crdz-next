'use client';

import { Copy, Ellipsis, ExternalLink, Mail } from 'lucide-react';
import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { copyText } from '@/lib/clipboard';

import type { Transaction } from '../model/transaction';

/** The trailing "…" menu of a row. */
export function RowActions({ transaction }: { transaction: Transaction }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`Actions for payment ${transaction.id}`}
        className="inline-flex size-7 items-center justify-center rounded-control text-fg-secondary hover:bg-surface-hover hover:text-fg data-[state=open]:bg-surface-pressed"
      >
        <Ellipsis className="size-4" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem asChild>
          <Link href={`/transactions/payments/${transaction.id}`}>
            <ExternalLink className="size-4 text-fg-muted" aria-hidden />
            View payment details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void copyText(transaction.id)}>
          <Copy className="size-4 text-fg-muted" aria-hidden />
          Copy payment ID
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void copyText(transaction.customer.email)}>
          <Mail className="size-4 text-fg-muted" aria-hidden />
          Copy customer email
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
