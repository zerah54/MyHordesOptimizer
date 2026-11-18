import { describe, expect, it } from 'vitest';

import { HOME_COLUMNS } from '../utils/citizen-homes';
import { texts } from './texts';

describe('textes de l\'onglet Maisons', () => {
    const keys: string[] = [
        'homes_tab_title', 'homes_search_name', 'homes_column_name', 'homes_column_update', 'homes_never',
        ...HOME_COLUMNS.map((c): string => c.label)
    ];

    it.each(keys)('%s existe dans les 4 langues', (key: string) => {
        const entry: Record<string, string> | undefined = (texts as unknown as Record<string, Record<string, string>>)[key];
        expect(entry).toBeDefined();
        for (const lang of ['en', 'fr', 'de', 'es']) {
            expect(entry[lang]?.trim().length).toBeGreaterThan(0);
        }
    });
});
