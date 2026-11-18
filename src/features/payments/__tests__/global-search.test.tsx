import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GlobalSearch } from '../components/global-search';
import { PaymentsDataProvider } from '../data/payments-data-provider';

const navigation = vi.hoisted(() => ({
  pathname: '/transactions/payments',
  params: new URLSearchParams(),
  push: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.params,
  useRouter: () => ({ push: navigation.push }),
}));

const NOW = Date.parse('2026-11-18T17:05:00.000Z');

const renderSearch = () =>
  render(
    <PaymentsDataProvider referenceNow={NOW}>
      <GlobalSearch />
    </PaymentsDataProvider>,
  );

describe('GlobalSearch (payments search in the top bar)', () => {
  let pushState: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    window.history.replaceState(null, '', '/transactions/payments?status=failed&page=3');
    navigation.pathname = '/transactions/payments';
    navigation.params = new URLSearchParams('status=failed&page=3');
    navigation.push.mockReset();
    pushState = vi.spyOn(window.history, 'pushState');
  });

  afterEach(() => pushState.mockRestore());

  it('filters the list on Enter, keeping other filters and resetting the page', async () => {
    renderSearch();

    await userEvent.type(screen.getByRole('combobox'), '4242{Enter}');

    expect(pushState).toHaveBeenCalledWith(null, '', '/transactions/payments?q=4242&status=failed');
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it('shows the current search term and clears it', async () => {
    navigation.params = new URLSearchParams('q=ava%40example.com');
    window.history.replaceState(null, '', '/transactions/payments?q=ava%40example.com');
    renderSearch();

    expect(screen.getByRole('combobox')).toHaveValue('ava@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(pushState).toHaveBeenCalledWith(null, '', '/transactions/payments');
  });

  it('opens the Payments list with the term from other pages', async () => {
    navigation.pathname = '/transactions/payments/pi_3AAAAAAAAAAAAAAAAAAAAAAAA';
    navigation.params = new URLSearchParams();
    renderSearch();

    await userEvent.type(screen.getByRole('combobox'), 'example.org{Enter}');

    expect(navigation.push).toHaveBeenCalledWith('/transactions/payments?q=example.org');
  });

  it('suggests matching payments that open their details', async () => {
    renderSearch();

    await userEvent.type(screen.getByRole('combobox'), 'pi_3');
    const options = await screen.findAllByRole('option');

    expect(options[0]).toHaveTextContent('Search payments for “pi_3”');
    await userEvent.click(options[1] as HTMLElement);
    expect(navigation.push).toHaveBeenCalledWith(
      expect.stringMatching(/^\/transactions\/payments\/pi_3/),
    );
  });
});
