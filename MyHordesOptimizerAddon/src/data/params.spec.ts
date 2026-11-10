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

/** Cherche une option par son id dans l'arborescence des paramètres. */
const find = (items: any[], id: string): any => {
    for (const item of items ?? []) {
        if (item.id === id) return item;
        const found = find(item.children, id);
        if (found) return found;
    }
    return undefined;
};

describe('params — Zen Hordes options', (): void => {
    it('expose update_zen avec une option pour les marqueurs de métiers et une pour le mode Chaos', (): void => {
        const zen = find(params_categories.flatMap((category) => category.params ?? []), 'update_zen');

        expect(zen).toBeDefined();
        expect(zen.children.map((child: any) => child.id)).toEqual(['update_zen_job_markers', 'update_zen_devastated']);
    });

    it('traduit chaque option Zen Hordes dans les quatre langues', (): void => {
        const zen = find(params_categories.flatMap((category) => category.params ?? []), 'update_zen');

        [zen, ...zen.children].forEach((option: any) => {
            ['en', 'fr', 'de', 'es'].forEach((lang: string) => expect(option.label[lang], `${option.id}.${lang}`).toBeTruthy());
        });
    });
});

describe('params — Mon programme et expédition dans l\'Outre-Monde', (): void => {
    const top_level: any[] = params_categories.flatMap((category) => category.params ?? []);

    it('« Mon programme » a un libellé court et détaille son contenu dans l\'aide', (): void => {
        const my_program = find(top_level, 'display_my_expeditions');

        expect(my_program.label.fr).toBe('Affiche « Mon programme »');
        ['en', 'fr', 'de', 'es'].forEach((lang: string) => expect(my_program.help?.[lang], lang).toBeTruthy());
    });

    it('le détail de l\'expédition dans l\'Outre-Monde est une option à part, pas un enfant de « Mon programme »', (): void => {
        const my_program = find(top_level, 'display_my_expeditions');
        const route = top_level.find((param: any) => param.id === 'display_expedition_route');

        expect(my_program.children ?? []).toEqual([]);
        expect(route).toBeDefined();
        [route.label, route.help].forEach((text: any) => {
            ['en', 'fr', 'de', 'es'].forEach((lang: string) => expect(text?.[lang], lang).toBeTruthy());
        });
    });
});

describe('params — Gest\'Hordes options', (): void => {
    it('expose les marqueurs de métiers parmi les options Gest\'Hordes, traduits dans les quatre langues', (): void => {
        const gh = find(params_categories.flatMap((category) => category.params ?? []), 'update_gh');
        const job_markers = gh.children.find((child: any) => child.id === 'update_gh_job_markers');

        expect(job_markers).toBeDefined();
        ['en', 'fr', 'de', 'es'].forEach((lang: string) => expect(job_markers.label[lang], lang).toBeTruthy());
    });
});

