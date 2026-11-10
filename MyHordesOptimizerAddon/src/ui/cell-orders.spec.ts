import { describe, expect, it, vi } from 'vitest';

import type { ApiExpeditionOrder } from '../types';
import { appendPassageGroups, createRouteLine } from './cell-orders';

/** `texts.ts` lit `getScriptInfo()` au chargement : sans Tampermonkey ni extension en jsdom, il est simulé */
vi.mock('../utils/version', () => ({
    convertResponsePromiseToError: (): Promise<never> => Promise.reject(new Error('mock')),
    getErrorFromApi: (error: unknown): unknown => error,
    getScriptInfo: (): { version: string; updateURL: string } => ({ version: '0.0.0', updateURL: 'about:blank' })
}));

function order(overrides: Partial<ApiExpeditionOrder>): ApiExpeditionOrder {
    return { type: 'checkbox', text: '', isDone: false, position: 0, kind: null, ...overrides };
}

describe('createRouteLine', (): void => {
    it('sans tracé lié : rien', (): void => {
        expect(createRouteLine({ id: 1, mapRoute: null })).toBeNull();
    });

    it('avec un tracé lié : pastille, nom et coût', (): void => {
        const line: HTMLDivElement | null = createRouteLine({
            id: 1,
            mapRoute: { id: 3, label: 'Boucle', color: 'teal', cells: [{ x: 10, y: 10 }, { x: 10, y: 9 }], length: 1, version: 1 }
        });
        expect(line?.classList.contains('mho-expedition-route-name')).toBe(true);
        expect(line?.querySelector('.mho-expedition-route-swatch')).not.toBeNull();
        expect(line?.textContent).toContain('Boucle');
    });
});

describe('appendPassageGroups', (): void => {
    it('mes consignes d\'abord, puis celles des autres membres avec leur nom', (): void => {
        const container: HTMLDivElement = document.createElement('div');

        appendPassageGroups(container, [{
            passage: null,
            ap: null,
            orders: [
                { order: order({ id: 1, text: '<p>Lui</p>' }), citizen_user_id: 7 },
                { order: order({ id: 2, text: '<p>Moi</p>' }), citizen_user_id: 42 }
            ]
        }], 42, new Map<number, string>([[7, 'Scipion']]));

        expect(container.children.length).toBe(2);
        expect(container.children[0].classList.contains('mho-order')).toBe(true);
        expect(container.children[0].textContent).toContain('Moi');
        expect(container.children[1].classList.contains('mho-expedition-route-others')).toBe(true);
        expect(container.children[1].textContent).toContain('— Scipion');
    });
});
