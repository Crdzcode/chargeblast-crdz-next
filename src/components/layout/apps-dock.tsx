import { AppsIcon } from '@/components/icons/dashboard-icons';
import { Unavailable } from '@/components/ui/unavailable';

/** Pinned Stripe Apps and the Apps launcher. The tiles are generic shapes, not real app logos. */
const PINNED_APPS = [
  {
    label: 'Pinned app: disputes',
    icon: (
      <>
        <path d="M3 3h2.6v7.4H9V13H3V3Z" fill="#0a2540" />
        <path d="M8.4 3.6h.9a4.4 4.4 0 0 1 0 8.8" fill="none" stroke="#2f6fed" strokeWidth="2.2" />
      </>
    ),
  },
  {
    label: 'Pinned app: analytics',
    icon: (
      <>
        <rect width="16" height="16" rx="3.5" fill="#4ba3e3" />
        <path
          d="M8 3.2 12.2 5.6v4.8L8 12.8l-4.2-2.4V5.6L8 3.2Zm0 0v4.8m0 0 4.2 2.4M8 8l-4.2 2.4M8 8l4.2-2.4M8 8 3.8 5.6M8 8v4.8"
          fill="none"
          stroke="#fff"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    label: 'Pinned app: alerts',
    icon: (
      <>
        <rect width="16" height="16" rx="3.5" fill="#0a0a0a" />
        <path d="M5.2 4.8h6v6l-2.2-1.6V7H6.8L5.2 4.8Z" fill="#3ecf6e" />
      </>
    ),
  },
] as const;

export function AppsDock() {
  return (
    <div className="mr-2 ml-4 hidden h-[34px] items-center gap-[15px] rounded-full border border-line px-[9px] md:flex">
      {PINNED_APPS.map((app) => (
        <Unavailable key={app.label}>
          <button
            type="button"
            aria-label={app.label}
            aria-disabled="true"
            className="inline-flex size-4 items-center justify-center rounded-[4px]"
          >
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden focusable="false">
              {app.icon}
            </svg>
          </button>
        </Unavailable>
      ))}
      <Unavailable>
        <button
          type="button"
          aria-label="Apps"
          aria-disabled="true"
          className="inline-flex size-4 items-center justify-center text-fg-secondary hover:text-fg"
        >
          <AppsIcon className="size-4" aria-hidden />
        </button>
      </Unavailable>
    </div>
  );
}
