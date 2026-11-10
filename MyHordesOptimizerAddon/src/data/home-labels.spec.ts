import { describe, expect, it } from 'vitest';

import type { I18nLabel } from '../types';
import { DAILY_ACTION_LABELS } from './daily-action-labels';
import { HOME_UPGRADES, HOUSE_LEVEL_KEY, HOUSE_LEVEL_LABELS } from './home-labels';

const LANGS: readonly (keyof I18nLabel)[] = ['fr', 'en', 'de', 'es'];

describe('libellés de maison et d\'actions quotidiennes', (): void => {
    it('chaque libellé a ses 4 langues non vides', (): void => {
        const labels: I18nLabel[] = [
            ...HOUSE_LEVEL_LABELS,
            ...Object.values(HOME_UPGRADES).map((u: { label: I18nLabel }): I18nLabel => u.label),
            ...Object.values(DAILY_ACTION_LABELS)
        ];
        expect(labels.length).toBe(9 + 9 + 11);
        for (const label of labels) {
            for (const lang of LANGS) {
                expect(typeof label[lang]).toBe('string');
                expect(label[lang].length).toBeGreaterThan(0);
            }
        }
    });

    it('reprend les libellés du site', (): void => {
        expect(HOUSE_LEVEL_KEY).toBe('houseLevel');
        expect(HOUSE_LEVEL_LABELS[0].fr).toBe('Lit de camp');
        expect(HOME_UPGRADES['kitchenLevel'].label.fr).toBe('Cuisine');
        expect(HOME_UPGRADES['kitchenLevel'].max_lvl).toBe(4);
        expect(HOME_UPGRADES['chestLevel'].max_lvl).toBe(13);
        expect(DAILY_ACTION_LABELS['trash'].fr).toBe('Fouiller les déchets');
    });
});
