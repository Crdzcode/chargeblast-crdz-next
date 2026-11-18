'use client';

import {
  ArrowLeftRight,
  ChartColumn,
  ChevronDown,
  Clock3,
  Ellipsis,
  House,
  Layers,
  Package,
  Radar,
  ReceiptText,
  Rocket,
  Scale,
  SquareTerminal,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Unavailable } from '@/components/ui/unavailable';
import { cn } from '@/lib/cn';

import { AccountMenu } from './account-menu';

interface NavItem {
  readonly label: string;
  readonly icon: LucideIcon;
  /** Only implemented sections have a route; the rest explain they are out of scope. */
  readonly href?: '/transactions/payments';
  readonly expandable?: boolean;
}

const PRIMARY: readonly NavItem[] = [
  { label: 'Home', icon: House },
  { label: 'Balances', icon: Scale },
  { label: 'Transactions', icon: ArrowLeftRight, href: '/transactions/payments' },
  { label: 'Customers', icon: User },
  { label: 'Product catalog', icon: Package },
];

const SHORTCUTS: readonly NavItem[] = [
  { label: 'Payments analytics', icon: Rocket },
  { label: 'Reports', icon: Clock3 },
  { label: 'Sigma', icon: Clock3 },
  { label: 'Radar', icon: Radar },
];

const PRODUCTS: readonly NavItem[] = [
  { label: 'Connect', icon: Layers, expandable: true },
  { label: 'Payments', icon: Wallet, expandable: true },
  { label: 'Billing', icon: ReceiptText, expandable: true },
  { label: 'Reporting', icon: ChartColumn, expandable: true },
  { label: 'More', icon: Ellipsis, expandable: true },
];

function NavEntry({ item, active }: { item: NavItem; active: boolean }) {
  const className = cn(
    'flex h-7 w-full items-center gap-2.5 rounded-control px-2 text-left text-[14px] font-medium transition-colors duration-100',
    active ? 'text-primary-text' : 'text-fg hover:bg-nav-active',
  );
  const content = (
    <>
      <item.icon
        className={cn('size-4 shrink-0', active ? 'text-primary-text' : 'text-fg-secondary')}
        aria-hidden
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.expandable ? <ChevronDown className="size-3.5 text-fg-muted" aria-hidden /> : null}
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} aria-current={active ? 'page' : undefined} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <Unavailable side="right">
      <button type="button" aria-disabled="true" className={className}>
        {content}
      </button>
    </Unavailable>
  );
}

function NavSection({
  title,
  items,
  pathname,
}: {
  title?: string;
  items: readonly NavItem[];
  pathname: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {title ? (
        <p className="px-2 pb-1 text-[13px] font-medium text-fg-secondary">{title}</p>
      ) : null}
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.label}>
            <NavEntry
              item={item}
              active={Boolean(item.href && pathname.startsWith('/transactions'))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Left navigation of the reference: account switcher, sections and Developers. */
export function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col px-3 pt-3 pb-3">
      <AccountMenu />
      <nav aria-label="Main" className="mt-5 flex flex-1 flex-col gap-6 overflow-y-auto">
        <NavSection items={PRIMARY} pathname={pathname} />
        <NavSection title="Shortcuts" items={SHORTCUTS} pathname={pathname} />
        <NavSection title="Products" items={PRODUCTS} pathname={pathname} />
      </nav>
      <ul className="pt-3">
        <li>
          <NavEntry item={{ label: 'Developers', icon: SquareTerminal }} active={false} />
        </li>
      </ul>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[230px] shrink-0 border-r border-line lg:block">
      <SidebarContent />
    </aside>
  );
}
