import { describe, expect, it } from 'vitest';

import { parseColumnPreferences } from '../hooks/use-column-preferences';
import { DEFAULT_COLUMNS } from '../model/columns';

describe('column preferences storage', () => {
  it('falls back to defaults for missing, corrupt or outdated data', () => {
    expect(parseColumnPreferences(null)).toEqual(DEFAULT_COLUMNS);
    expect(parseColumnPreferences('{not json')).toEqual(DEFAULT_COLUMNS);
    expect(parseColumnPreferences(JSON.stringify({ version: 0, columns: [] }))).toEqual(
      DEFAULT_COLUMNS,
    );
  });

  it('restores stored order, width and visibility', () => {
    const restored = parseColumnPreferences(
      JSON.stringify({
        version: 1,
        columns: [{ id: 'description', visible: false, order: 0, width: 200 }],
      }),
    );

    expect(restored[0]).toMatchObject({ id: 'description', visible: false, width: 200 });
  });
});
