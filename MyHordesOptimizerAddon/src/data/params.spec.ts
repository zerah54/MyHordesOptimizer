import { describe, expect, it } from 'vitest';

import { params_categories } from './params';

describe('params — chest option', (): void => {
    it('exposes update_mho_chest among the MyHordesOptimizer options', (): void => {
        // Recursively collect all option IDs from nested structure
        const collectOptionIds = (items: any[]): string[] => {
            if (!items) return [];

            const ids: string[] = [];
            for (const item of items) {
                if (item.id) {
                    ids.push(item.id);
                }
                if (item.children) {
                    ids.push(...collectOptionIds(item.children));
                }
            }
            return ids;
        };

        // Collect all option IDs from all params in all categories
        const all_option_ids = params_categories.flatMap((category) =>
            collectOptionIds(category.params ?? [])
        );

        expect(all_option_ids).toContain('update_mho_chest');
    });
});
