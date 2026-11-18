import { expect, test, type Page } from '@playwright/test';

const LIST = '/transactions/payments';
const rows = (page: Page) => page.locator('table tbody tr');
const summary = (page: Page) =>
  page.getByRole('navigation', { name: 'Pagination' }).locator('p').first();

/** Fails the test on any console error or uncaught exception (hydration included). */
function trackConsole(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  return errors;
}

async function openChip(page: Page, label: string) {
  await page
    .getByRole('group', { name: 'Filters' })
    .getByRole('button', { name: label, exact: true })
    .click();
}

/** Column headers also contain the "Reorder … column" handle in their accessible name. */
const columnHeader = (page: Page, label: string) =>
  page.getByRole('columnheader', { name: new RegExp(`${label}$`) }).first();

test.describe('Payments list', () => {
  test('renders the reference layout with the six required columns and no console errors', async ({
    page,
  }) => {
    const errors = trackConsole(page);
    await page.goto(LIST);

    await expect(page.getByRole('heading', { name: 'Transactions', level: 1 })).toBeVisible();
    for (const label of ['All', 'Succeeded', 'Refunded', 'Disputed', 'Failed', 'Uncaptured']) {
      await expect(
        page.getByRole('group', { name: 'Payment views' }).getByRole('button', { name: label }),
      ).toBeVisible();
    }
    for (const header of ['Amount', 'Status', 'Payment method', 'Customer', 'Payment ID', 'Date']) {
      await expect(columnHeader(page, header)).toBeVisible();
    }
    await expect(rows(page)).toHaveCount(25);
    await expect(summary(page)).toContainText('Viewing 1–25 of');
    expect(errors).toEqual([]);
  });

  test('paginates with 25, 50 and 100 rows per page', async ({ page }) => {
    await page.goto(LIST);

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(summary(page)).toContainText('Viewing 26–50');
    await expect(page).toHaveURL(/page=2/);

    await page.getByLabel('Rows per page').selectOption('50');
    await expect(rows(page)).toHaveCount(50);
    await expect(summary(page)).toContainText('Viewing 1–50');

    await page.getByLabel('Rows per page').selectOption('100');
    await expect(rows(page)).toHaveCount(100);
    await expect(page).toHaveURL(/pageSize=100/);
    await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  test('Today preset only shows payments from today and survives a reload', async ({ page }) => {
    await page.goto(LIST);
    await openChip(page, 'Date and time');
    await page.getByRole('radio', { name: 'Today' }).check();
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page).toHaveURL(/datePreset=today/);
    const count = await rows(page).count();
    expect(count).toBeGreaterThan(0);
    for (const text of await page.locator('table tbody tr td time').allTextContents()) {
      expect(text).toMatch(/^Nov 18,/);
    }

    await page.reload();
    await expect(page.getByRole('group', { name: 'Filters' })).toContainText('Today');
    await expect(rows(page)).toHaveCount(count);
  });

  test('combines status and payment method filters, keeps them in the URL and clears them', async ({
    page,
  }) => {
    await page.goto(LIST);

    await openChip(page, 'Status');
    await page.getByRole('checkbox', { name: 'Failed' }).click();
    await page.getByRole('button', { name: 'Apply' }).click();

    await openChip(page, 'Payment method');
    await page.getByRole('checkbox', { name: 'Card' }).click();
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page).toHaveURL(/status=failed/);
    await expect(page).toHaveURL(/method=card/);
    for (const text of await rows(page).locator('td:nth-child(3)').allTextContents()) {
      expect(text).toContain('Failed');
    }

    await page.reload();
    await expect(page.getByRole('group', { name: 'Filters' })).toContainText('Failed');
    await page.getByRole('button', { name: 'Clear filters' }).first().click();
    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
  });

  test('filters by amount range', async ({ page }) => {
    await page.goto(LIST);
    await openChip(page, 'Amount');
    await page.getByRole('textbox', { name: 'Minimum amount' }).fill('100');
    await page.getByRole('textbox', { name: 'Maximum amount' }).fill('200');
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(page).toHaveURL(/minAmount=10000&maxAmount=20000/);
    for (const text of await rows(page)
      .locator('td:nth-child(2) .font-semibold')
      .allTextContents()) {
      const value = Number(text.replace(/[^\d.]/g, ''));
      expect(value).toBeGreaterThanOrEqual(100);
      expect(value).toBeLessThanOrEqual(200);
    }
  });

  test('searches by last 4 digits, email and payment ID', async ({ page }) => {
    await page.goto(LIST);
    const firstRow = rows(page).first();
    const last4 =
      (await firstRow.locator('[role="img"]').first().textContent())?.replace(/\D/g, '') ?? '';
    const email = (await firstRow.locator('td:nth-child(6)').textContent())?.trim() ?? '';
    const search = page.getByRole('searchbox', { name: /Search payments/ });

    await search.fill(last4);
    await expect(page).toHaveURL(new RegExp(`q=${last4}`));
    for (const text of await rows(page).allTextContents()) expect(text).toContain(last4);

    await search.fill(email);
    await expect(page).toHaveURL(/q=.*%40/);
    for (const text of await rows(page).locator('td:nth-child(6)').allTextContents()) {
      expect(text).toContain(email);
    }

    await rows(page).first().getByRole('cell').nth(4).click();
    await expect(page).toHaveURL(/\/transactions\/payments\/pi_3/);
    const id = page.url().split('/').pop() ?? '';

    await page.goto(LIST);
    await page.getByRole('searchbox', { name: /Search payments/ }).fill(id.toUpperCase());
    await expect(rows(page)).toHaveCount(1);
  });

  test('sorts by amount ascending', async ({ page }) => {
    await page.goto(LIST);
    const amountHeader = page
      .getByRole('table')
      .getByRole('button', { name: 'Amount', exact: true });

    await amountHeader.click();
    await expect(page).toHaveURL(/sort=amount/);
    await amountHeader.click();
    await expect(page).toHaveURL(/sort=amount&direction=asc/);

    // The URL updates before the table re-renders, so poll until the rows settle.
    await expect
      .poll(async () => {
        const cents = (
          await rows(page).locator('td:nth-child(2) .font-semibold').allTextContents()
        ).map((text) => Math.round(Number(text.replace(/[^\d.]/g, '')) * 100));

        return (
          cents.length > 0 &&
          cents.every((value, index) => index === 0 || cents[index - 1]! <= value)
        );
      })
      .toBe(true);
  });

  test('shows an empty state that clears filters', async ({ page }) => {
    await page.goto(`${LIST}?q=zzzz-no-match`);
    await expect(page.getByRole('heading', { name: 'No results found' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).last().click();
    await expect(rows(page)).toHaveCount(25);
  });

  test('exports the current filtered view as CSV', async ({ page }) => {
    await page.goto(`${LIST}?status=refunded`);
    const total = Number(
      (await summary(page).textContent())?.match(/of ([\d,]+)/)?.[1]?.replace(',', ''),
    );

    await page.getByRole('button', { name: 'Export' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: /Current view/ }).click();
    const download = await downloadPromise;
    const chunks = await (await download.createReadStream()).toArray();
    const lines = Buffer.concat(chunks).toString('utf8').trim().split('\r\n');

    expect(download.suggestedFilename()).toMatch(/^payments-\d{4}-\d{2}-\d{2}-\d{4}\.csv$/);
    expect(lines[0]).toContain('Amount,Status,Payment method');
    expect(lines).toHaveLength(total + 1);
    expect(lines.slice(1).every((line) => line.includes('Refunded'))).toBe(true);
  });

  test('copies the full payment ID to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(LIST);
    const firstRow = rows(page).first();
    const button = firstRow.getByRole('button', { name: /^Copy payment ID / });
    const label = (await button.getAttribute('aria-label')) ?? '';

    await firstRow.hover();
    await button.click();
    await expect(firstRow.getByRole('button', { name: /^Copied / })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      label.replace('Copy payment ID ', ''),
    );
  });

  test('persists column visibility and keyboard resizing', async ({ page }) => {
    await page.goto(LIST);
    await page.getByRole('button', { name: 'Edit columns' }).click();
    await page.getByRole('checkbox', { name: 'Description' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('columnheader', { name: /Description$/ })).toHaveCount(0);

    const separator = page.getByRole('separator', { name: 'Resize Customer column' });
    const before = Number(await separator.getAttribute('aria-valuenow'));
    await separator.focus();
    await page.keyboard.press('ArrowRight');
    await expect(separator).toHaveAttribute('aria-valuenow', String(before + 8));

    await page.reload();
    await expect(page.getByRole('columnheader', { name: /Description$/ })).toHaveCount(0);
    await expect(page.getByRole('separator', { name: 'Resize Customer column' })).toHaveAttribute(
      'aria-valuenow',
      String(before + 8),
    );
  });

  test('saves and re-applies a named filter', async ({ page }) => {
    await page.goto(`${LIST}?view=failed&currency=USD`);
    await page.getByRole('button', { name: 'Saved filters' }).click();
    await page.getByLabel('Save current filters as').fill('Failed USD');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.keyboard.press('Escape');

    await page.goto(LIST);
    await page.getByRole('button', { name: 'Saved filters' }).click();
    await page.getByRole('button', { name: 'Apply saved filter Failed USD' }).click();
    await expect(page).toHaveURL(/view=failed&currency=USD/);
    await expect(page.getByRole('button', { name: 'Failed', pressed: true })).toBeVisible();
  });
});

test.describe('Payment details', () => {
  test('opens from a row, shows the timeline and returns to the filtered list', async ({
    page,
  }) => {
    const errors = trackConsole(page);
    await page.goto(`${LIST}?view=refunded&sort=amount`);
    await rows(page).first().getByRole('cell').nth(3).click();

    await expect(page).toHaveURL(/\/transactions\/payments\/pi_3/);
    await expect(page.getByRole('heading', { name: 'Timeline' })).toBeVisible();
    await expect(page.getByText('Payment refunded')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Metadata' })).toBeVisible();

    await page.getByRole('main').getByRole('link', { name: 'Payments' }).click();
    await expect(page).toHaveURL(/view=refunded&sort=amount/);
    expect(errors).toEqual([]);
  });

  test('responds 404 with a not-found state for unknown payment IDs', async ({ page }) => {
    const response = await page.goto(`${LIST}/pi_3doesnotexist`);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Payment not found' })).toBeVisible();
  });
});

test.describe('Shell', () => {
  test('global search suggests payments and opens the details page', async ({ page }) => {
    await page.goto(LIST);
    const email = (await rows(page).first().locator('td:nth-child(6)').textContent())?.trim() ?? '';

    await page.getByRole('combobox', { name: 'Search' }).fill(email.slice(0, 8));
    await expect(page.getByRole('listbox', { name: 'Search suggestions' })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/transactions\/payments\/pi_3/);
  });

  test('account menu opens from the sidebar', async ({ page }) => {
    await page.goto(LIST);
    await page.getByRole('button', { name: /Open account menu/ }).click();
    await expect(page.getByRole('menuitem', { name: 'Copy account ID' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Sign out' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
