'use client';

import {
  ChartColumn,
  ChevronDown,
  Clock3,
  Ellipsis,
  House,
  Layers,
  Package,
  ReceiptText,
  Repeat,
  SquareTerminal,
  User,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType, ReactNode, SVGProps } from 'react';

import { BalancesIcon, PushPinIcon } from '@/components/icons/dashboard-icons';
import { Unavailable } from '@/components/ui/unavailable';
import { cn } from '@/lib/cn';

import { AccountMenu } from './account-menu';

interface NavItem {
  readonly label: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Only Transactions has a route. The other entries say "Not available in this demo". */
  readonly href?: '/transactions/payments';
  readonly expandable?: boolean;
}

const PRIMARY: readonly NavItem[] = [
  { label: 'Home', icon: House },
  { label: 'Balances', icon: BalancesIcon },
  { label: 'Transactions', icon: Repeat, href: '/transactions/payments' },
  { label: 'Customers', icon: User },
  { label: 'Product catalog', icon: Package },
];

const SHORTCUTS: readonly NavItem[] = [
  { label: 'Payments analytics', icon: PushPinIcon },
  { label: 'Reports', icon: Clock3 },
  { label: 'Sigma', icon: Clock3 },
  // Stripe uses the same clock icon for every recent shortcut.
  { label: 'Radar', icon: Clock3 },
];

const PRODUCTS: readonly NavItem[] = [
  { label: 'Connect', icon: Layers, expandable: true },
  { label: 'Payments', icon: Wallet, expandable: true },
  { label: 'Billing', icon: ReceiptText, expandable: true },
  { label: 'Reporting', icon: ChartColumn, expandable: true },
  { label: 'More', icon: Ellipsis, expandable: true },
];

function NavEntry({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  // Taller rows in the mobile drawer give fingers a bigger target.
  const className = cn(
    'flex h-7 w-full items-center gap-2.5 rounded-control px-2 text-left text-[14px] font-medium transition-colors duration-100 max-lg:h-9',
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
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
        className={className}
      >
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
  onNavigate,
}: {
  title?: string;
  items: readonly NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {title ? (
        <p className="px-[3px] text-[13px] leading-5 font-medium text-fg-secondary">{title}</p>
      ) : null}
      <ul className="flex flex-col gap-0.5">
        {items.map((item) => (
          <li key={item.label}>
            <NavEntry
              item={item}
              active={item.href !== undefined && pathname.startsWith(item.href)}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SidebarContentProps {
  /** Rendered beside the account switcher, e.g. the drawer's close button. */
  readonly headerAction?: ReactNode;
  /** Called when a link is followed, so the mobile drawer can close. */
  readonly onNavigate?: () => void;
}

export function SidebarContent({ headerAction, onNavigate }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col px-3 pt-2 pb-3">
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <AccountMenu />
        </div>
        {headerAction}
      </div>
      <nav aria-label="Main" className="mt-8 flex flex-1 flex-col gap-[31px] overflow-y-auto">
        <NavSection items={PRIMARY} pathname={pathname} onNavigate={onNavigate} />
        <NavSection
          title="Shortcuts"
          items={SHORTCUTS}
          pathname={pathname}
          onNavigate={onNavigate}
        />
        <NavSection title="Products" items={PRODUCTS} pathname={pathname} onNavigate={onNavigate} />
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
