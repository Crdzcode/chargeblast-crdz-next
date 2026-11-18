# Stripe Payments screen

My take on the Chargeblast front-end challenge: the Transactions > Payments page of the Stripe
Dashboard, rebuilt with Next.js 16 (App Router), React 19 and strict TypeScript. The data is
generated locally, so there is no account, API or backend to set up.

## Running it

You need Node.js 20.9 or newer (I used 24).

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000), which redirects to `/transactions/payments`.

Other scripts:

```bash
npm run typecheck
npm run lint
npm test              # Vitest + Testing Library
npm run build
npm run test:e2e      # Playwright against `next start`, so build first
npm run format:check
```

The first Playwright run needs a browser: `npx playwright install chromium`.

## What's in it

From the brief:

- The payments table: amount with its currency, status, payment method (brand tile and last 4
  digits), description, customer, date and payment ID. The ID is shortened in the table; the
  tooltip shows the full value, and the copy button only says "Copied" once the clipboard write
  has actually worked. Hovering or focusing a date shows how long ago it was.
- Statuses: Succeeded, Pending, Failed and Refunded, plus Canceled and Blocked because the
  reference has them too.
- Sorting by date, amount and status. Ties fall back to the date and then the ID, so rows don't
  jump around between sorts.
- 25, 50 or 100 rows per page.
- Filters for date (Today, Last 7 days, Last 30 days or a custom range), status, payment method
  (card, ACH, wallet) and amount, plus Currency and Card brand under "More filters".
- Search by payment ID, customer email or last 4 digits. It uses the search field in the top bar,
  since the reference has no separate table search. Enter filters the table and adds a "Search"
  chip you can edit or remove; picking a suggestion opens that payment.
- About 1,000 payments in USD, BRL, EUR and GBP.

The nice-to-haves, in the order the brief listed them:

1. Left sidebar with the sections from the reference (Home, Balances, Transactions, Customers,
   Product catalog, Shortcuts, Products, Developers).
2. Top bar search that also suggests payments and customers, and an account menu on the account
   switcher.
3. A details page at `/transactions/payments/[paymentId]` with the event timeline, payment method,
   details and metadata. Unknown IDs get a real 404, and the back link returns to the filters you
   had.
4. Saved filters (kept in the browser) and shareable URLs: filters, sort and page all live in the
   query string.
5. Columns can be resized (mouse or arrow keys) and reordered (drag or keyboard). "Edit columns"
   hides the optional ones and resets the layout. The layout is saved per browser.
6. CSV export of the current view (every matching row across all pages, in the current sort) or of
   the selected rows.

The status cards above the filters (All, Succeeded, Refunded, Disputed, Failed, Uncaptured), row
selection, the row menu, loading/empty/error/404 states and a mobile layout are there as well.

Parts of the dashboard that are outside the scope (Home, Balances, Create payment, Analyze, the
other Transactions tabs and so on) look like the reference, but show "Not available in this demo"
on hover or focus instead of doing nothing.

## Mock data

`src/features/payments/data/generate-transactions.ts` builds the dataset from a fixed seed. Each
payment is placed a number of days before today at a fixed time of day, so the data follows the
calendar: the date presets have rows on whatever day you open the app, a payment keeps its ID and
details from one day to the next, and nothing is dated in the future. Refund and dispute dates
always fall between the payment and now.

The server reads the clock once per request (`getReferenceTime()`, called after `connection()` so
the build can't freeze it) and sends that timestamp to the browser, which generates the same data
again. That keeps the server HTML and the hydrated page identical, and it's why render code has no
`Math.random()` or bare `new Date()`.

To pin the clock for screenshots or tests, set `PAYMENTS_REFERENCE_TIME`:

```bash
PAYMENTS_REFERENCE_TIME=2026-11-18T17:05:00.000Z npm run start
```

The Playwright config already does this.

Dates are shown and filtered in the account's time zone, America/Sao_Paulo, on both server and
client. Date ranges cover whole days and include both ends. The helpers in `src/lib/time-zone.ts`
only use `Intl`, and their tests cover DST changes.

Sorting and the amount filter compare amounts in minor units across currencies. I didn't want to
make up exchange rates, so to look at a single currency, combine the Amount filter with Currency
(the filter panel says so).

## Code layout

```text
src/
├── app/                                  # routes
│   ├── (dashboard)/layout.tsx            # sidebar + top bar, reads the request clock
│   └── (dashboard)/transactions/payments/
│       ├── (list)/                       # payments list, with its own loading and error UI
│       └── [paymentId]/                  # payment details and not-found
├── components/
│   ├── layout/                           # sidebar, top bar, search, account menu
│   ├── icons/                            # the few icons lucide doesn't have
│   └── ui/                               # small Radix-based primitives
├── features/payments/
│   ├── model/                            # transaction, query and column types
│   ├── lib/                              # pipeline, URL format, dates, amounts, CSV, saved filters
│   ├── data/                             # seeded generator and its catalog, request clock
│   ├── hooks/                            # URL query, column preferences, saved filters
│   ├── components/                       # table, cells, filters, toolbar, details page
│   └── __tests__/
├── lib/                                  # time zone, storage, clipboard
└── app/globals.css                       # Tailwind theme with colors taken from the reference
e2e/                                      # Playwright tests
```

The URL holds the query (filters, search, sort, page). Column preferences and saved filters are in
localStorage, read through `useSyncExternalStore` so the first render matches the server. Row
selection is plain component state. What the table shows comes from one pure function,
`runPaymentsQuery` in `lib/pipeline.ts`, which searches, filters, sorts and paginates, so there is
no store to keep in sync.

## Libraries

The brief prefers Next.js with TypeScript. The App Router takes care of routing, the loading, error
and not-found screens, and reading the clock on the server. Filtering, sorting, the URL format, CSV
and saved filters are plain TypeScript with their own tests, so they don't depend on React.

- Tailwind CSS 4 for the design tokens.
- Radix UI for popovers, tooltips, menus, checkboxes and dialogs. It ships unstyled, so all of the
  styling here is custom.
- dnd-kit for column reordering, because it supports dragging with the keyboard.
- lucide-react for icons.
- Vitest and Testing Library for unit and component tests, Playwright for end-to-end tests on the
  production build.

I left out a state library, since the URL and the pipeline already cover it. I also skipped
TanStack Table: `model/columns.ts` already handles sorting, widths, order and visibility, and a
second column model would duplicate it. There's no shadcn styling, which would pull the look away
from Stripe, and no web font, because the reference uses the system font stack.

## Known limitations

- Everything is in memory; nothing is saved on a server.
- Saved filters and column settings are per browser, not per account.
- The reference has no Payment ID column. I put it after the reference columns so they keep their
  places, which means scrolling right to see it. You can move it with Edit columns or by dragging.
- Like the reference, the status column has no header text. "Status" appears on hover or focus, and
  clicking it sorts by status.
- Failed, canceled and blocked rows have a disabled checkbox, as in the reference, so "Selected
  payments" only exports payments that went through. "Current view" exports everything.
- Dashboard areas outside the scope are visual placeholders.
